import React, { useReducer, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate } from "react-router-dom";
import {
  Container, TextField, Button, Card, CardContent, Typography,
  Grid, Alert, AppBar, Toolbar
} from "@mui/material";

const Log = async (stack, level, pkg, message) => {
  try {
    const body = JSON.stringify({ stack, level, package: pkg, message });
    const response = await fetch("http://20.244.56.144/evaluation-service/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    const data = await response.json();
    let x = document.getElementById("logs");
    if (x) x.innerHTML += `<div style="font-size:12px;color:blue">[${stack}-${level}] ${pkg}: ${message} (logID: ${data.logID})</div>`;
  } catch (err) {
    let x = document.getElementById("logs");
    if (x) x.innerHTML += `<div style="font-size:12px;color:red">Logging failed: ${err.message}</div>`;
  }
};

const withLogging = (reducer, logger) => {
  return (state, action) => {
    logger(action);
    return reducer(state, action);
  };
};

const localLogger = (action) => {
  let x = document.getElementById("logs");
  if (x) x.innerHTML += `<div style="font-size:12px">Local Log Action: ${JSON.stringify(action)}</div>`;
};

const initialState = {
  urls: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_URL":
      return { ...state, urls: [...state.urls, action.payload] };
    default:
      return state;
  }
};

const ShortenerPage = ({ state, dispatch }) => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState([{ url: "", validity: "", shortcode: "" }]);
  const [errors, setErrors] = useState([]);

  const validateInputs = () => {
    let errs = [];
    inputs.forEach((input, idx) => {
      const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
      if (!urlRegex.test(input.url)) {
        errs.push(`Row ${idx + 1}: Invalid URL`);
        Log("frontend", "error", "component", `Row ${idx+1}: Invalid URL entered`);
      }
      if (input.validity && isNaN(parseInt(input.validity))) {
        errs.push(`Row ${idx + 1}: Validity must be integer`);
        Log("frontend", "warn", "component", `Row ${idx+1}: Validity not an integer`);
      }
      if (input.shortcode && !/^[a-zA-Z0-9]+$/.test(input.shortcode)) {
        errs.push(`Row ${idx + 1}: Shortcode must be alphanumeric`);
        Log("frontend", "warn", "component", `Row ${idx+1}: Invalid shortcode`);
      }
      if (input.shortcode && state.urls.some(u => u.shortcode === input.shortcode)) {
        errs.push(`Row ${idx + 1}: Shortcode already exists`);
        Log("frontend", "error", "component", `Row ${idx+1}: Shortcode already exists`);
      }
    });
    return errs;
  };

  const handleSubmit = () => {
    const validationErrors = validateInputs();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    inputs.forEach(input => {
      const shortcode = input.shortcode || Math.random().toString(36).substring(2, 7);
      const validityMinutes = input.validity ? parseInt(input.validity) : 30;
      const expiresAt = new Date(Date.now() + validityMinutes * 60000);
      dispatch({
        type: "ADD_URL",
        payload: { original: input.url, shortcode, expiresAt }
      });
      Log("frontend", "info", "component", `Shortened URL created with shortcode ${shortcode}, valid ${validityMinutes} mins`);
    });

    navigate("/stats");
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>URL Shortener</Typography>
      {inputs.map((input, idx) => (
        <Card key={idx} sx={{ mb:2 }}>
          <CardContent>
            <TextField
              fullWidth label="Long URL" value={input.url}
              onChange={e => updateInput(idx, "url", e.target.value)} sx={{mb:2}}
            />
            <TextField
              label="Validity (mins)" value={input.validity}
              onChange={e => updateInput(idx, "validity", e.target.value)} sx={{mr:2}}
            />
            <TextField
              label="Custom Shortcode" value={input.shortcode}
              onChange={e => updateInput(idx, "shortcode", e.target.value)}
            />
          </CardContent>
        </Card>
      ))}
      <Grid container spacing={2}>
        <Grid item>
          <Button variant="contained" onClick={handleSubmit}>Shorten</Button>
        </Grid>
        <Grid item>
          <Button disabled={inputs.length >= 5} onClick={() => setInputs([...inputs, { url:"", validity:"", shortcode:"" }])}>
            Add another
          </Button>
        </Grid>
      </Grid>
      {errors.map((err, i) => <Alert severity="error" key={i}>{err}</Alert>)}
    </Container>
  );

  function updateInput(idx, field, value) {
    const updated = [...inputs];
    updated[idx][field] = value;
    setInputs(updated);
  }
};

const StatsPage = ({ urls }) => (
  <Container>
    <Typography variant="h4" gutterBottom>Shortened URLs Statistics</Typography>
    {urls.length === 0 && <Alert severity="info">No URLs shortened yet.</Alert>}
    {urls.map((u, idx) => (
      <Card key={idx} sx={{ mb:2 }}>
        <CardContent>
          <Typography>Original: <a href={u.original}>{u.original}</a></Typography>
          <Typography>Short: <Link to={`/${u.shortcode}`}>{window.location.origin}/{u.shortcode}</Link></Typography>
          <Typography>Expires at: {new Date(u.expiresAt).toLocaleString()}</Typography>
          <Typography>Time left: {Math.round((new Date(u.expiresAt) - Date.now())/60000)} mins</Typography>
        </CardContent>
      </Card>
    ))}
  </Container>
);

const RedirectHandler = ({ urls }) => {
  const { shortcode } = useParams();
  const found = urls.find(u => u.shortcode === shortcode && new Date() < new Date(u.expiresAt));
  if (!found) {
    Log("frontend", "error", "component", `Attempted to access invalid/expired shortcode: ${shortcode}`);
    return <Container><Alert severity="error">Invalid or expired link</Alert></Container>;
  }
  Log("frontend", "info", "component", `Redirecting shortcode ${shortcode} to ${found.original}`);
  return <Navigate to={found.original} />;
};

export default function App() {
  const [state, dispatch] = useReducer(withLogging(reducer, localLogger), initialState);

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/">Shorten URL</Button>
          <Button color="inherit" component={Link} to="/stats">Statistics</Button>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<ShortenerPage state={state} dispatch={dispatch} />} />
        <Route path="/stats" element={<StatsPage urls={state.urls} />} />
        <Route path="/:shortcode" element={<RedirectHandler urls={state.urls} />} />
      </Routes>

      <div id="logs" style={{margin:"20px", fontFamily:"monospace", background:"#eee", padding:"10px"}}>
        <b>Local + API Logs:</b>
      </div>
    </Router>
  );
}
