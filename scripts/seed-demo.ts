import { seedDemoData } from '../src/lib/seedDemoData';

async function run() {
  console.log('Iniciando sembrado de datos de prueba industriales...');
  const res = await seedDemoData(true);
  console.log(res.message);
}

run().catch(console.error);
