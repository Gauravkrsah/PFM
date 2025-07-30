const { exec } = require('child_process');

console.log('🔄 Stopping existing backend processes...');

// Kill processes using port 8000
exec('netstat -ano | findstr :8000', (error, stdout) => {
  if (stdout) {
    const lines = stdout.split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[1].includes(':8000')) {
        pids.add(parts[4]);
      }
    });
    
    pids.forEach(pid => {
      if (pid && pid !== '0') {
        console.log(`🔪 Killing process ${pid} on port 8000...`);
        exec(`taskkill /PID ${pid} /F`, (err) => {
          if (!err) console.log(`✅ Process ${pid} terminated`);
        });
      }
    });
    
    if (pids.size > 0) {
      console.log('⏳ Waiting for processes to terminate...');
      setTimeout(() => {
        console.log('✅ Backend cleanup complete');
      }, 2000);
    } else {
      console.log('✅ No backend processes found to kill');
    }
  } else {
    console.log('✅ Port 8000 is free');
  }
});