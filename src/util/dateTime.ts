
export function displayTransactionDate(dateString: Date | string) {
    const date = new Date(dateString);
  
    // Get the date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
  
    // Get the time components
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
  
    // Assemble the date-time string
    const dateTimeString = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  
    return dateTimeString;
}

export function getCurrentDateTime() {
    const now = new Date();
  
    // Get the date components
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
  
    // Get the time components
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
  
    // Assemble the date-time string
    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  
    return dateTimeString;
}
  
export function dateFormat(dateString: Date | string = new Date(), separator: string = "-") {
    // Create a Date object from the string
    const date = new Date(dateString);
  
    // Extract day, month, and year components
    const day = date.getDate().toString().padStart(2, "0");
    // const month = date.toLocaleDateString("en-US", { month: "short" });
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
  
    // Format the date in the desired format
    return `${day}${separator}${month}${separator}${year}`;
}

export function chatTimeFormat(dateString: string) {
    // Create a Date object from the string
    const date = new Date(dateString);
  
    // Extract hours, minutes, and meridian indicator
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const meridian = hours >= 12 ? "PM" : "AM";
  
    // Adjust hours for 12-hour format and handle special cases
    const adjustedHours = hours % 12 || 12; // 0 becomes 12 for consistency
  
    // Format the time in the desired format
    return `${adjustedHours}:${minutes} ${meridian}`;
}
  