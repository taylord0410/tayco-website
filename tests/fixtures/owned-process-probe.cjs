// Test-only IPC telemetry, loaded explicitly into owned child processes.
if(process.send){
 process.on('message',message=>{
  if(message&&message.type==='owned-process-probe'&&typeof message.nonce==='string'){
   process.send({type:'owned-process-probe',nonce:message.nonce,pid:process.pid,ppid:process.ppid,cwd:process.cwd(),argv:process.argv,memory:process.memoryUsage()});
  }
 });
 process.channel?.unref();
}
