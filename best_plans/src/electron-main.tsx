import { homedir, tmpdir } from 'os';
import { mkdir, mkdtemp, readdir, readFile, stat, writeFile } from 'fs/promises';
/*
Keep this super barebones, IPC Calls to access the os/filesystem, everything else in the main tsx app

*/