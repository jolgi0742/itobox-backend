'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const packages = [];
    const statuses = ['pending', 'received', 'processing', 'in_transit', 'delivered', 'exception'];
    const couriers = ['UPS', 'FedEx', 'DHL', 'USPS'];
    const priorities = ['standard', 'express', 'urgent'];
    
    // Crear 50 paquetes de ejemplo
    for (let i = 1; i <= 50; i++) {
      const clientId = Math.floor(Math.random() * 3) + 1; // Cliente 1, 2 o 3
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const courier = couriers[Math.floor(Math.random() * couriers.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      
      const trackingPrefixes = {
        'UPS': '1Z999AA',
        'FedEx': '1234567',
        'DHL': '1234567890',
        'USPS': '9400110200'
      };
      
      const weight = (Math.random() * 10 + 0.5).toFixed(2);
      const value = (Math.random() * 500 + 50).toFixed(2);
      const shippingCost = (Math.random() * 50 + 15).toFixed(2);
      
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
      
      let receivedAt = null;
      let deliveredAt = null;
      
      if (['received', 'processing', 'in_transit', 'delivered', 'exception'].includes(status)) {
        receivedAt = new Date(createdDate);
        receivedAt.setHours(receivedAt.getHours() + Math.floor(Math.random() * 24));
      }
      
      if (status === 'delivered') {
        deliveredAt = new Date(receivedAt || createdDate);
        deliveredAt.setDate(deliveredAt.getDate() + Math.floor(Math.random() * 7) + 1);
      }

      packages.push({
        package_code: `PKG-${i.toString().padStart(7, '0')}`,
        client_id: clientId,
        tracking_number: `${trackingPrefixes[courier]}${Math.random().toString().substr(2, 8)}`,
        courier: courier,
        destination_info: JSON.stringify({
          recipientName: `Destinatario ${i}`,
          recipientCompany: Math.random() > 0.5 ? `Empresa ${i}` : null,
          address: {
            street: `Dirección ${i}`,
            city: 'San José',
            state: 'San José',
            zipCode: '10101',
            country: 'Costa Rica'
          },
          phone: `+506-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `destinatario${i}@email.com`
        }),
        package_details: JSON.stringify({
          description: `Paquete de ejemplo ${i}`,
          weight: parseFloat(weight),
          weightUnit: 'kg',
          dimensions: {
            length: Math.floor(Math.random() * 50) + 10,
            width: Math.floor(Math.random() * 30) + 10,
            height: Math.floor(Math.random() * 20) + 5,
            unit: 'cm'
          },
          value: parseFloat(value),
          currency: 'USD',
          category: ['electronics', 'clothing', 'books', 'toys', 'other'][Math.floor(Math.random() * 5)],
          fragile: Math.random() > 0.7
        }),
        customs_info: JSON.stringify({
          description: `Descripción aduanera ${i}`,
          value: parseFloat(value),
          currency: 'USD',
          countryOfOrigin: 'United States',
          customsDeclaration: ['commercial', 'personal', 'gift'][Math.floor(Math.random() * 3)]
        }),
        shipping_cost: parseFloat(shippingCost),
        insurance_value: Math.random() > 0.5 ? parseFloat(value) : null,
        status: status,
        priority: priority,
        special_instructions: Math.random() > 0.7 ? `Instrucciones especiales para paquete ${i}` : null,
        received_at: receivedAt,
        delivered_at: deliveredAt,
        estimated_delivery: deliveredAt || new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        created_at: createdDate,
        updated_at: new Date()
      });
    }

    await queryInterface.bulkInsert('packages', packages, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('packages', {
      package_code: {
        [Sequelize.Op.like]: 'PKG-%'
      }
    }, {});
  }
};