(function (root) {
  'use strict';

  function available() {
    return Boolean(root.tf && root.knnClassifier);
  }

  function featureVector(sample, baseline, angleDiff) {
    if (!sample || !baseline) return null;
    const roll = angleDiff(sample.gamma, baseline.gamma);
    const pitch = angleDiff(sample.beta, baseline.beta);
    const motion = Number.isFinite(sample.energy) ? sample.energy : 0;
    return [roll / 45, pitch / 45, Math.min(motion, 8) / 8];
  }

  class MotionModel {
    constructor() {
      this.classifier = available() ? root.knnClassifier.create() : null;
    }

    add(label, values) {
      if (!this.classifier || !values) return false;
      const tensor = root.tf.tensor1d(values);
      this.classifier.addExample(tensor, label);
      tensor.dispose();
      return true;
    }

    async predict(values) {
      if (!this.classifier || !values || this.classifier.getNumClasses() < 2) return null;
      const tensor = root.tf.tensor1d(values);
      const result = await this.classifier.predictClass(tensor, 3);
      tensor.dispose();
      return result;
    }

    counts() {
      return this.classifier ? this.classifier.getClassExampleCount() : {};
    }

    clear() {
      if (this.classifier) this.classifier.clearAllClasses();
    }
  }

  root.MotionQuestModel = {available, featureVector, MotionModel};
})(globalThis);
