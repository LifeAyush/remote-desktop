import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { formatDistanceToNow } from 'date-fns';

const NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}$/;
const ENV_KEY_RE = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;

const memoryLabel = (mb) => (mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 ? 1 : 0)} GB` : `${mb} MB`);

const PairEditor = ({ title, hint, rows, onChange, fields, validate }) => {
  const empty = Object.fromEntries(fields.map((f) => [f.key, '']));
  const [draft, setDraft] = useState(empty);
  const problem = Object.values(draft).every((v) => v === '') ? '' : validate(draft, rows);
  const add = () => {
    onChange([...rows, draft]);
    setDraft(empty);
  };
  return (
    <Box>
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {hint}
      </Typography>
      <Box className="flex gap-2 items-start">
        {fields.map((f) => (
          <TextField
            key={f.key}
            size="small"
            label={f.label}
            type={f.type || 'text'}
            value={draft[f.key]}
            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            sx={{ flex: 1 }}
          />
        ))}
        <Button variant="outlined" startIcon={<AddIcon />} onClick={add} disabled={!!problem || fields.some((f) => !f.optional && !draft[f.key])}>
          Add
        </Button>
      </Box>
      {problem && <Typography variant="caption" color="error">{problem}</Typography>}
      {rows.length > 0 && (
        <Table size="small" sx={{ mt: 1 }}>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {fields.map((f) => (
                  <TableCell key={f.key} className="font-mono">{row[f.key]}</TableCell>
                ))}
                <TableCell align="right" padding="checkbox">
                  <IconButton size="small" aria-label="remove" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

const TaskForm = ({ images, onPull, onSubmit, submitting, step, onNext, onBack }) => {
  const [form, setForm] = useState({ image: '', name: '', cpus: 1, memory_mb: 512, command: '', env: [], ports: [] });
  const [pullRef, setPullRef] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullError, setPullError] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const pull = async () => {
    setPulling(true);
    setPullError('');
    try {
      const img = await onPull(pullRef.trim());
      set({ image: img.tags[0] || pullRef.trim() });
      setPullRef('');
    } catch (err) {
      setPullError(err.message);
    } finally {
      setPulling(false);
    }
  };

  const nameError = form.name && !NAME_RE.test(form.name) ? "Letters, digits, '_', '.', '-'; start with a letter or digit" : '';
  const valid = [!!form.image, !!form.name && !nameError, true][step];

  const spec = () => ({
    name: form.name,
    image: form.image,
    cpus: form.cpus,
    memory_mb: form.memory_mb,
    command: form.command.trim() || null,
    env: Object.fromEntries(form.env.map((e) => [e.key, e.value])),
    ports: form.ports.map((p) => ({ container_port: Number(p.container_port), host_port: Number(p.host_port) })),
  });

  const imageStep = (
    <Box className="space-y-4">
      <Typography variant="subtitle1">Choose an image on this host</Typography>
      {images.length ? (
        <List dense sx={{ maxHeight: 320, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {images.flatMap((img) =>
            img.tags.map((tag) => (
              <ListItemButton key={tag} selected={form.image === tag} onClick={() => set({ image: tag })}>
                <ListItemText
                  primary={<span className="font-mono">{tag}</span>}
                  secondary={`${img.size_mb.toFixed(1)} MB · built ${formatDistanceToNow(new Date(img.created), { addSuffix: true })}`}
                />
              </ListItemButton>
            ))
          )}
        </List>
      ) : (
        <Alert severity="info">No tagged images on this host yet. Pull one below.</Alert>
      )}
      <Divider />
      <Typography variant="subtitle1">Or pull one</Typography>
      <Box className="flex gap-2">
        <TextField
          size="small"
          label="Image reference"
          placeholder="nginx:1.27-alpine"
          value={pullRef}
          onChange={(e) => setPullRef(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={pull} disabled={!pullRef.trim() || pulling}>
          {pulling ? 'Pulling…' : 'Pull'}
        </Button>
      </Box>
      {pullError && <Alert severity="error">{pullError}</Alert>}
    </Box>
  );

  const configureStep = (
    <Box className="space-y-6">
      <TextField
        label="Container name"
        value={form.name}
        onChange={(e) => set({ name: e.target.value })}
        error={!!nameError}
        helperText={nameError || 'Must be unique on this host'}
        fullWidth
        required
      />
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Box>
          <Typography gutterBottom>CPU limit: {form.cpus} {form.cpus === 1 ? 'core' : 'cores'}</Typography>
          <Slider value={form.cpus} onChange={(_, v) => set({ cpus: v })} min={0.25} max={4} step={0.25} marks={[{ value: 0.25, label: '0.25' }, { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }]} />
        </Box>
        <Box>
          <Typography gutterBottom>Memory limit: {memoryLabel(form.memory_mb)}</Typography>
          <Slider value={form.memory_mb} onChange={(_, v) => set({ memory_mb: v })} min={64} max={4096} step={64} marks={[{ value: 64, label: '64 MB' }, { value: 1024, label: '1 GB' }, { value: 4096, label: '4 GB' }]} />
        </Box>
      </Box>
      <TextField
        label="Command (optional)"
        placeholder="Leave empty to use the image's default"
        value={form.command}
        onChange={(e) => set({ command: e.target.value })}
        fullWidth
        className="font-mono"
      />
      <PairEditor
        title="Environment variables"
        hint="Passed to the container. The UI only ever shows the names back."
        rows={form.env}
        onChange={(env) => set({ env })}
        fields={[{ key: 'key', label: 'Name' }, { key: 'value', label: 'Value', optional: true }]}
        validate={(d, rows) =>
          !ENV_KEY_RE.test(d.key) ? 'Names use letters, digits and _, and do not start with a digit' : rows.some((r) => r.key === d.key) ? 'Already added' : ''
        }
      />
      <PairEditor
        title="Published ports"
        hint="Host ports bind to 127.0.0.1 on the Docker host, and must be 1024 or higher."
        rows={form.ports}
        onChange={(ports) => set({ ports })}
        fields={[{ key: 'container_port', label: 'Container port', type: 'number' }, { key: 'host_port', label: 'Host port', type: 'number' }]}
        validate={(d, rows) => {
          const c = Number(d.container_port);
          const h = Number(d.host_port);
          if (d.container_port && !(c >= 1 && c <= 65535)) return 'Container port must be 1–65535';
          if (d.host_port && !(h >= 1024 && h <= 65535)) return 'Host port must be 1024–65535';
          if (rows.some((r) => Number(r.host_port) === h)) return 'Host port already used above';
          return '';
        }}
      />
    </Box>
  );

  const s = spec();
  const reviewStep = (
    <Table size="small">
      <TableBody>
        {[
          ['Name', s.name],
          ['Image', s.image],
          ['CPU', `${s.cpus} ${s.cpus === 1 ? 'core' : 'cores'}`],
          ['Memory', memoryLabel(s.memory_mb)],
          ['Command', s.command || "image default"],
          ['Environment', Object.keys(s.env).join(', ') || 'none'],
          ['Ports', s.ports.map((p) => `127.0.0.1:${p.host_port} → ${p.container_port}`).join(', ') || 'none'],
        ].map(([k, v]) => (
          <TableRow key={k}>
            <TableCell sx={{ width: 160, fontWeight: 500 }}>{k}</TableCell>
            <TableCell className="font-mono">{v}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 2) onSubmit(spec());
      }}
    >
      {[imageStep, configureStep, reviewStep][step]}
      <Box className="mt-8 flex justify-between">
        <Button variant="outlined" onClick={onBack} disabled={step === 0 || submitting}>
          Back
        </Button>
        {step === 2 ? (
          // Distinct keys: reusing one <button> and flipping it to type="submit"
          // mid-click would submit the form straight from the Configure step.
          <Button key="submit" type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Starting…' : 'Create and start'}
          </Button>
        ) : (
          <Button key="next" type="button" variant="contained" onClick={onNext} disabled={!valid}>
            Next
          </Button>
        )}
      </Box>
    </form>
  );
};

TaskForm.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, tags: PropTypes.arrayOf(PropTypes.string), size_mb: PropTypes.number, created: PropTypes.string })
  ).isRequired,
  onPull: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  step: PropTypes.number.isRequired,
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default TaskForm;
