import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import "xterm/css/xterm.css";
import { createWebSocket } from "../utils/api";

const Terminal = ({ sessionId, height = "400px" }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);

  // Initialize terminal
  useEffect(() => {
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
    });

    // Add fit addon to resize terminal to container
    const fitAddon = new FitAddon();
    xtermRef.current.loadAddon(fitAddon);

    // Add web links addon for clickable URLs
    const webLinksAddon = new WebLinksAddon();
    xtermRef.current.loadAddon(webLinksAddon);

    // Open terminal in the container
    xtermRef.current.open(terminalRef.current);
    fitAddon.fit();

    // Add welcome message
    xtermRef.current.writeln(
      "\x1B[1;34m=== Remote Desktop SSH Terminal ===\x1B[0m"
    );
    xtermRef.current.writeln(
      "Type commands to interact with the remote server."
    );
    xtermRef.current.writeln("");
    xtermRef.current.write("$ ");

    // Setup WebSocket connection
    setupWebSocket();

    // Handle resizing
    const handleResize = () => {
      if (fitAddon) {
        fitAddon.fit();

        // Send terminal size to server if WebSocket is connected
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "resize",
              cols: xtermRef.current.cols,
              rows: xtermRef.current.rows,
            })
          );
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Function to handle user input
    xtermRef.current.onData((data) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "input",
            data: data,
          })
        );
      } else {
        // Echo locally if not connected
        xtermRef.current.write(data);
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
  }, []);

  // Setup WebSocket connection
  const setupWebSocket = () => {
    if (!sessionId) {
      console.warn("No session ID provided for terminal");
      return;
    }

    try {
      wsRef.current = createWebSocket(`/terminal/${sessionId}`, {
        onOpen: () => {
          // Connected to server
          if (xtermRef.current) {
            xtermRef.current.writeln(
              "\r\n\x1B[1;32mConnected to terminal server!\x1B[0m"
            );
            xtermRef.current.write("$ ");

            // Send terminal size
            wsRef.current.send(
              JSON.stringify({
                type: "resize",
                cols: xtermRef.current.cols,
                rows: xtermRef.current.rows,
              })
            );
          }
        },
        onMessage: (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "output" && xtermRef.current) {
              xtermRef.current.write(message.data);
            }
          } catch (error) {
            // Handle raw text data
            if (xtermRef.current) {
              xtermRef.current.write(event.data);
            }
          }
        },
        onClose: () => {
          if (xtermRef.current) {
            xtermRef.current.writeln(
              "\r\n\x1B[1;31mDisconnected from terminal server\x1B[0m"
            );
            xtermRef.current.writeln("Reconnecting in 3 seconds...");
          }

          // Attempt to reconnect after a delay
          setTimeout(() => {
            setupWebSocket();
          }, 3000);
        },
        onError: (error) => {
          console.error("Terminal WebSocket error:", error);
          if (xtermRef.current) {
            xtermRef.current.writeln(
              "\r\n\x1B[1;31mError connecting to terminal server\x1B[0m"
            );
          }
        },
      });
    } catch (error) {
      console.error("Failed to create terminal WebSocket:", error);
    }
  };

  // Placeholder for actual WebSocket implementation
  const simulateTerminalCommand = (command) => {
    // Simulate response for testing
    if (command.trim() === "ls") {
      return `file1.txt
file2.txt
folder1/
folder2/
app.conf
`;
    } else if (command.trim() === "ps") {
      return `  PID TTY          TIME CMD
 1234 pts/0    00:00:01 bash
 5678 pts/0    00:00:00 ps
 9012 pts/1    00:02:34 node
`;
    } else if (command.trim() === "help") {
      return `Available commands:
  ls    - List files
  ps    - List processes
  clear - Clear screen
  help  - Show this help
`;
    } else if (command.trim() === "clear") {
      return "\x1Bc";
    } else {
      return `Command not found: ${command}\r\n`;
    }
  };

  return (
    <div className="terminal-container" style={{ height, width: "100%" }}>
      <div ref={terminalRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
};

Terminal.propTypes = {
  sessionId: PropTypes.string.isRequired,
  height: PropTypes.string,
};

export default Terminal;
