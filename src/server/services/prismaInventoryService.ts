// PrismaInventoryService is now superseded by the modular InventoryService.
// Re-export InventoryService as PrismaInventoryService for any legacy imports.
export { InventoryService as PrismaInventoryService } from '../modules/inventory/inventoryService';
export * from '../modules/inventory/inventoryService';
