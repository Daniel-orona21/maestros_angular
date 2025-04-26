const { exec } = require('child_process');

// Run the sonar scanner with environment variables
exec('sonar-scanner', { env: { ...process.env } }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error: ${stderr}`);
  }
  console.log(stdout);
  process.exit();
}); 