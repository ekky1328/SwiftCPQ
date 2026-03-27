import app from './app';

export default function startServer() {
    
  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`Listening: http://localhost:${port}`);
  });

}