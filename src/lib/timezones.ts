export const timezones = [
    { value: 'GMT-12', label: 'GMT-12:00' },
    { value: 'GMT-11', label: 'GMT-11:00' },
    { value: 'GMT-10', label: 'GMT-10:00 (HST)' },
    { value: 'GMT-9', label: 'GMT-09:00 (AKST)' },
    { value: 'GMT-8', label: 'GMT-08:00 (PST)' },
    { value: 'GMT-7', label: 'GMT-07:00 (MST)' },
    { value: 'GMT-6', label: 'GMT-06:00 (CST)' },
    { value: 'GMT-5', label: 'GMT-05:00 (EST)' },
    { value: 'GMT-4', label: 'GMT-04:00 (AST)' },
    { value: 'GMT-3', label: 'GMT-03:00' },
    { value: 'GMT-2', label: 'GMT-02:00' },
    { value: 'GMT-1', label: 'GMT-01:00' },
    { value: 'GMT+0', label: 'GMT+00:00 (GMT)' },
    { value: 'GMT+1', label: 'GMT+01:00 (CET)' },
    { value: 'GMT+2', label: 'GMT+02:00 (EET)' },
    { value: 'GMT+3', label: 'GMT+03:00 (MSK)' },
    { value: 'GMT+4', label: 'GMT+04:00' },
    { value: 'GMT+5', label: 'GMT+05:00' },
    { value: 'GMT+6', label: 'GMT+06:00' },
    { value: 'GMT+7', label: 'GMT+07:00' },
    { value: 'GMT+8', label: 'GMT+08:00 (CST)' },
    { value: 'GMT+9', label: 'GMT+09:00 (JST)' },
    { value: 'GMT+10', label: 'GMT+10:00 (AEST)' },
    { value: 'GMT+11', label: 'GMT+11:00' },
    { value: 'GMT+12', label: 'GMT+12:00' },
  ];
  
  function getOffset(timezone: string): number {
    if (!timezone) return 0;
    const match = timezone.match(/GMT([+-])(\d+)/);
    if (!match) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    return sign * parseInt(match[2], 10);
  }
  
  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'
    }).replace(' ', ''); // remove space before AM/PM
  }

  // Function to check if EST is currently observing EDT
  export function getESTAbbreviation(): 'EST' | 'EDT' {
    const now = new Date();
    const jan = new Date(now.getFullYear(), 0, 1);
    const jul = new Date(now.getFullYear(), 6, 1);
    const stdTimezoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    return now.getTimezoneOffset() < stdTimezoneOffset ? 'EDT' : 'EST';
  }
  
  export function convertToEST(startTime: string, endTime: string, fromTimezone: string): { start: string, end: string } {
    if (!startTime || !endTime || !fromTimezone || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      return { start: '', end: '' };
    }
  
    const fromOffset = getOffset(fromTimezone);
    const estAbbreviation = getESTAbbreviation();
    const estOffset = estAbbreviation === 'EDT' ? -4 : -5;
    
    const offsetDifference = estOffset - fromOffset;
  
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Use a common base date
  
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
  
    const startDate = new Date(today);
    startDate.setHours(startH + offsetDifference, startM);
  
    const endDate = new Date(today);
    endDate.setHours(endH + offsetDifference, endM);
  
    return {
      start: formatTime(startDate),
      end: formatTime(endDate),
    };
  }
  
    