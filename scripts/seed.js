const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/config/database');
const { User } = require('../src/models');

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Iniciando seed de la base de datos...');

    // Crear usuario administrador por defecto
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@itobox.com' },
      defaults: {
        firstName: 'Administrador',
        lastName: 'ITOBOX',
        email: 'admin@itobox.com',
        password: adminPassword,
        company: 'ITOBOX Courier',
        phone: '+1234567890',
        role: 'admin',
        isActive: true,
        preferences: {
          language: 'es',
          theme: 'light',
          notifications: true
        }
      }
    });

    if (created) {
      console.log('✅ Usuario administrador creado:');
      console.log('   Email: admin@itobox.com');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }

    // Crear usuario de prueba
    const userPassword = await bcrypt.hash('user123', 12);
    
    const [user, userCreated] = await User.findOrCreate({
      where: { email: 'user@itobox.com' },
      defaults: {
        firstName: 'Usuario',
        lastName: 'Prueba',
        email: 'user@itobox.com',
        password: userPassword,
        company: 'Empresa Demo',
        phone: '+0987654321',
        role: 'user',
        isActive: true,
        preferences: {
          language: 'es',
          theme: 'light',
          notifications: true
        }
      }
    });

    if (userCreated) {
      console.log('✅ Usuario de prueba creado:');
      console.log('   Email: user@itobox.com');
      console.log('   Password: user123');
    } else {
      console.log('ℹ️  Usuario de prueba ya existe');
    }

    console.log('🎉 Seed completado exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedDatabase();