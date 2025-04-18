from app import app, db
from models import User, Team, Member, Site, ExpenseRecord

with app.app_context():
    # Drop all existing tables
    db.drop_all()
    
    # Create all tables fresh
    db.create_all()
    
    # Create default admin user if not exists
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', email='admin@example.com', is_admin=True)
        admin.set_password('admin123')
        db.session.add(admin)
    
    # Create some default sites if needed
    default_sites = ['Site 1', 'Site 2', 'Site 3']
    for site_name in default_sites:
        if not Site.query.filter_by(name=site_name).first():
            site = Site(name=site_name)
            db.session.add(site)
    
    db.session.commit()
    print("Database has been initialized successfully")