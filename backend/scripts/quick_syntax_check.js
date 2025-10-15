// quick_syntax_check.js - requires key backend modules to surface syntax errors
const paths = [
  '../services/openaiClient',
  '../services/sessionStore',
  '../routes/interview'
];

paths.forEach(p => {
  try {
    require(p);
    console.log('OK:', p);
  } catch (err) {
    console.error('ERR:', p, err && err.stack ? err.stack.split('\n')[0] : err);
  }
});
