export default async () => {
  await (global as any).__MONGOD__.stop();
};
