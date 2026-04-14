const { z } = require('zod');

// Schema for creating a new Service Request
const serviceRequestSchema = z.object({
    vehicleType: z.string({
        required_error: "Vehicle type is required",
    })
    .min(2, "Vehicle type must be at least 2 characters")
    .max(50, "Vehicle type is too long"),
    
    serviceType: z.string({
        required_error: "Service type is required",
    }),
    
    location: z.object({
        address: z.string({
            required_error: "Service address is required",
        }).min(5, "Address requires more detail"),
        
        type: z.literal('Point').optional().default('Point'),
        
        // Ensure coordinates is exactly a tuple of [longitude, latitude] numbers
        coordinates: z.tuple([z.number(), z.number()]).optional()
    }),
    
    description: z.string().optional()
});

module.exports = {
    serviceRequestSchema
};
