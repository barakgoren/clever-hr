import 'dotenv/config';
import { app } from './app';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Claver HR API running on http://localhost:${PORT}`);
  console.log(`📖 API docs: http://localhost:${PORT}/docs\n`);
});
//