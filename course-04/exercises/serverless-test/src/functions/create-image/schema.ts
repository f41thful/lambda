export default {
  type: "object",
  properties: {
    groupId: { type: 'string' },
    timestamp: {type: 'string'}
  },
  required: ['groupId', 'timestamp']
} as const;
