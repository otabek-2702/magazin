export async function sendCutCommand(command) {
    try {
      // Request port access
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 }); // Adjust baud rate as needed
  
      // Create writer
      const writer = port.writable.getWriter();
  
      // Send the cut command
      const data = new TextEncoder().encode(command);
      await writer.write(data);
  
      // Close the writer and port
      writer.releaseLock();
      await port.close();
    } catch (error) {
      console.error('Error sending cut command:', error);
    }
  }