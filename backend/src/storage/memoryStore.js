/**
 * Intentionally simple in-memory store.
 * If you later want MongoDB, replace this module with a Mongoose model + CRUD functions.
 */
let draft = {
  project: null,
  vulnerabilities: []
};

const memoryStore = {
  getDraft() {
    return draft;
  },

  setDraft(nextDraft) {
    draft = {
      project: nextDraft.project ?? null,
      vulnerabilities: Array.isArray(nextDraft.vulnerabilities)
        ? nextDraft.vulnerabilities
        : []
    };
  }
};

module.exports = { memoryStore };

