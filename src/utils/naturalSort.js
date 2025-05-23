export function naturalSort(a, b) {
    const ax = [], bx = [];
  
    // Ensure a and b are strings before calling replace
    const strA = String(a === null || a === undefined ? '' : a);
    const strB = String(b === null || b === undefined ? '' : b);
  
    strA.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
    strB.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });
    
    while(ax.length && bx.length) {
      const an = ax.shift();
      const bn = bx.shift();
      const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
      if(nn) return nn;
    }
  
    return ax.length - bx.length;
  }