const fs = {
  files: new Map<string, Blob>(),
  writeFile(filename: string, data: Blob): void {
    fs.files.set(filename, data);
  },
  readFile(filename: string): Blob {
    const data = fs.files.get(filename);
    if (!data) {
      throw new Error(`File ${filename} not found`);
    }
    return data;
  },
  rm(filename: string): void {
    if (filename === "*") {
      fs.files.clear();
      return;
    }

    for (const key of fs.files.keys()) {
      if (key.startsWith(filename)) {
        fs.files.delete(key);
      }
    }
  },
};

export default fs;
