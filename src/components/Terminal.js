import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";
import { API_BASE_URL } from "../utils/api";

const Terminal = ({ socketUrl, height = "100%" }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);

  // Initialize terminal
  useEffect(() => {
    // Wait for DOM to be ready
    if (!terminalRef.current) return;

    // Create terminal instance
    xtermRef.current = new XTerm({
      theme: {
        background: "#1F2937",
        foreground: "#F9FAFB",
        cursor: "#F9FAFB",
        black: "#374151",
        red: "#EF4444",
        green: "#10B981",
        yellow: "#F59E0B",
        blue: "#3B82F6",
        magenta: "#8B5CF6",
        cyan: "#06B6D4",
        white: "#F3F4F6",
        brightBlack: "#6B7280",
        brightRed: "#F87171",
        brightGreen: "#34D399",
        brightYellow: "#FBBF24",
        brightBlue: "#60A5FA",
        brightMagenta: "#A78BFA",
        brightCyan: "#22D3EE",
        brightWhite: "#FFFFFF",
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 1000,
      allowTransparency: true,
    });

    // Add fit addon to resize terminal to container
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    xtermRef.current.loadAddon(fitAddon);

    // Add web links addon for clickable URLs
    const webLinksAddon = new WebLinksAddon();
    xtermRef.current.loadAddon(webLinksAddon);

    // Open terminal in the container
    xtermRef.current.open(terminalRef.current);
    
    // Wait a moment before fitting to ensure DOM is ready
    setTimeout(() => {
      try {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      } catch (e) {
        console.error("Error fitting terminal:", e);
      }
    }, 100);

    // Add welcome message
    xtermRef.current.writeln(
      "\x1B[1;34m=== Remote Desktop Terminal ===\x1B[0m"
    );
    xtermRef.current.writeln(
      "Type commands to interact with the remote server."
    );
    xtermRef.current.writeln("");
    xtermRef.current.write("$ ");

    // Setup WebSocket connection
    const wsUrl = `ws://localhost:8000/ws/client`;
    console.log("Connecting to WebSocket:", wsUrl);
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connection opened");
        if (xtermRef.current) {
          xtermRef.current.writeln(
            "\r\n\x1B[1;32mConnected to terminal server!\x1B[0m"
          );
          xtermRef.current.write("$ ");
        }
      };

      wsRef.current.onmessage = (event) => {
        console.log("Received message:", event.data);
        if (xtermRef.current) {
          xtermRef.current.write(event.data);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        if (xtermRef.current) {
          xtermRef.current.writeln(
            "\r\n\x1B[1;31mDisconnected from terminal server\x1B[0m"
          );
          xtermRef.current.writeln("Reconnecting in 3 seconds...");
        }
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          console.log("Attempting to reconnect...");
          if (wsRef.current) {
            wsRef.current = new WebSocket(wsUrl);
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (xtermRef.current) {
          xtermRef.current.writeln(
            "\r\n\x1B[1;31mError connecting to terminal server\x1B[0m"
          );
        }
      };
    } catch (e) {
      console.error("Error creating WebSocket connection:", e);
      if (xtermRef.current) {
        xtermRef.current.writeln(
          "\r\n\x1B[1;31mFailed to connect to terminal server\x1B[0m"
        );
      }
    }

    // Handle resizing
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
          
          // Send terminal dimensions to server
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const dimensions = {
              cols: xtermRef.current.cols,
              rows: xtermRef.current.rows
            };
            wsRef.current.send(JSON.stringify({
              type: 'resize',
              dimensions
            }));
          }
        } catch (e) {
          console.error("Error resizing terminal:", e);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Function to handle user input
    xtermRef.current.onData((data) => {
      // Don't echo locally - let the server echo back
      // Send the data to the server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'input',
          data
        }));
      }
    });

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [socketUrl]);

  return (
    <div className="terminal-container" style={{ height, width: "100%", position: "relative", overflow: "hidden" }}>
      <div ref={terminalRef} style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }} />
    </div>
  );
};

Terminal.propTypes = {
  socketUrl: PropTypes.string,
  height: PropTypes.string,
};

export default Terminal;