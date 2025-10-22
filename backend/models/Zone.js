const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  zoneId: {
    type: String,
    required: true,
    index: true
  },
  zoneName: {
    type: String,
    required: true
  },
  population: {
    type: Number,
    required: true,
    min: 0
  },
  density: {
    type: Number,
    required: true,
    min: 0
  },
  cluster: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['normal', 'moderate', 'overcrowded'],
    default: 'normal'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
zoneSchema.index({ zoneId: 1, timestamp: -1 });

// Virtual for occupancy percentage
zoneSchema.virtual('occupancyPercentage').get(function() {
  return ((this.population / this.capacity) * 100).toFixed(2);
});

// Instance method to check if zone is overcrowded
zoneSchema.methods.isOvercrowded = function() {
  return this.status === 'overcrowded';
};

// Static method to get latest data for all zones
zoneSchema.statics.getLatestData = async function() {
  return await this.aggregate([
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$zoneId',
        zoneName: { $first: '$zoneName' },
        population: { $first: '$population' },
        density: { $first: '$density' },
        cluster: { $first: '$cluster' },
        capacity: { $first: '$capacity' },
        status: { $first: '$status' },
        timestamp: { $first: '$timestamp' }
      }
    }
  ]);
};

// Static method to get zone history
zoneSchema.statics.getZoneHistory = async function(zoneId, minutes = 15) {
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
  return await this.find({
    zoneId: zoneId,
    timestamp: { $gte: cutoffTime }
  }).sort({ timestamp: 1 });
};

const Zone = mongoose.model('Zone', zoneSchema);

module.exports = Zone;