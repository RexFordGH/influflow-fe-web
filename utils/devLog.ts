export const devLog = (label: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    const color = '#5383ec';
    console.log(
      `%c[Influxy] ${label}`,
      `background: ${color}; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;`,
      ...args,
    );
  }
};
