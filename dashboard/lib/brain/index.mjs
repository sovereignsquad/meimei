import * as memory from "./memory.mjs";

export const brain = {
  memory,
  
  async init(repoRoot) {
    await memory.ensureBrainDir(repoRoot);
    await memory.syncFromProjectFiles(repoRoot);
    return { ok: true, initialized: true };
  },
  
  async think(repoRoot, question, options) {
    return memory.think(repoRoot, question, options);
  },
  
  async learn(repoRoot, fact, source) {
    return memory.learn(repoRoot, fact, source);
  },
  
  async log(repoRoot, activity) {
    return memory.logActivity(repoRoot, activity);
  },
  
  async getContext(repoRoot, query) {
    return memory.getContext(repoRoot, query);
  },
  
  async updateUser(repoRoot, context) {
    return memory.updateUserContext(repoRoot, context);
  },
  
  async readLayers(repoRoot) {
    return memory.readAllLayers(repoRoot);
  },
  
  async readLayer(repoRoot, layer) {
    return memory.readLayer(repoRoot, layer);
  },
  
  async writeLayer(repoRoot, layer, content) {
    return memory.writeLayer(repoRoot, layer, content);
  },
  
  async buildContext(repoRoot, options) {
    return memory.buildContextForLLM(repoRoot, options);
  },
  
  layers: memory.LAYERS
};

export default brain;
