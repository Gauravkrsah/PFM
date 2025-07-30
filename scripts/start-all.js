const { exec, spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Personal Finance Manager...');

// Function to kill existing backend processes
function killBackend() {
  return new Promise((resolve) => {
    console.log('🔄 Checking for existing backend processes...');
    
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
        
        if (pids.size > 0) {
          console.log(`🔪 Killing ${pids.size} existing backend process(es)...`);
          let killed = 0;
          
          pids.forEach(pid => {
            if (pid && pid !== '0') {
              exec(`taskkill /PID ${pid} /F`, (err) => {
                killed++;
                if (killed === pids.size) {
                  setTimeout(() => {
                    console.log('✅ Backend cleanup complete');
                    resolve();
                  }, 2000);
                }
              });
            }
          });
        } else {
          console.log('✅ No existing backend processes found');
          resolve();
        }
      } else {
        console.log('✅ Port 8000 is free');
        resolve();
      }
    });
  });
}

// Main execution
async function startAll() {
  try {
    await killBackend();
    
    console.log('🔧 Starting backend server...');
    const backend = spawn('python', ['main.py'], {
      cwd: path.join(__dirname, '..', 'backend'),
      stdio: 'inherit',
      shell: true
    });
    
    // Wait for backend to start
    setTimeout(() => {
      console.log('🌐 Starting frontend...');
      const frontend = spawn('npm', ['start'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        shell: true
      });
      
      console.log('✅ Both servers are starting!');
      console.log('📍 Backend: http://localhost:8000');
      console.log('📍 Frontend: http://localhost:3000');
      
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error starting servers:', error);
  }
}

startAll();