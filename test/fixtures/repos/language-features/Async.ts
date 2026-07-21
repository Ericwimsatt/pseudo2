async function fetchData(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

async function loadAll() {
  const [a, b] = await Promise.all([
    fetchData('/api/a'),
    fetchData('/api/b'),
  ]);
  return { a, b };
}

async function firstResult() {
  const result = await Promise.race([
    fetchData('/api/a'),
    fetchData('/api/b'),
  ]);
  return result;
}

// Generator function
function* idGenerator(): Generator<number> {
  let id = 0;
  while (true) {
    yield id++;
  }
}

// For-await-of
async function processUrls(urls: string[]) {
  const results: string[] = [];
  for await (const data of urls.map((u) => fetchData(u))) {
    results.push(data);
  }
  return results;
}

export { fetchData, loadAll, firstResult, idGenerator, processUrls };
