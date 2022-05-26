export const capitalize = (str) => {
    if(str){
      const lower = str.toLowerCase();
      const firstLetter = str.charAt(0)
      if(["¿", "¡"].includes(firstLetter)){
        return firstLetter +str.charAt(1).toUpperCase() + lower.slice(2);
      }
      return str.charAt(0).toUpperCase() + lower.slice(1);
    }
    
    return ""
  }