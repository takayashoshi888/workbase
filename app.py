from flask import Flask, render_template, request, redirect, url_for, flash, send_file
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Team, Member, Site, ExpenseRecord
from datetime import datetime
import os
import csv
from io import StringIO
from functools import wraps
from flask_migrate import Migrate  # 添加这行

app = Flask(__name__, template_folder='templates')
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Admin decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            flash('需要管理员权限', 'danger')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create tables
with app.app_context():
    db.create_all()
    # Add default admin if not exists
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', email='admin@example.com', is_admin=True)
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()

# Routes
@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))
        flash('无效的用户名或密码', 'danger')
    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('用户名已存在', 'danger')
        elif User.query.filter_by(email=email).first():
            flash('邮箱已存在', 'danger')
        else:
            user = User(username=username, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            flash('注册成功，请登录', 'success')
            return redirect(url_for('login'))
    return render_template('auth/register.html')

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    # 实现密码重置逻辑
    return render_template('auth/forgot_password.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/dashboard')
@login_required
def dashboard():
    # 获取统计数据
    total_expenses = db.session.query(
        db.func.sum(ExpenseRecord.highway_fee + ExpenseRecord.parking_fee)
    ).scalar() or 0
    
    user_expenses = db.session.query(
        db.func.sum(ExpenseRecord.highway_fee + ExpenseRecord.parking_fee)
    ).filter_by(user_id=current_user.id).scalar() or 0
    
    recent_records = ExpenseRecord.query.order_by(
        ExpenseRecord.date.desc()).limit(5).all()
    
    return render_template('dashboard.html',
                         total_expenses=total_expenses,
                         user_expenses=user_expenses,
                         recent_records=recent_records)

# 数据采集路由
@app.route('/data_collection', methods=['GET', 'POST'])
@login_required
def data_collection():
    if request.method == 'POST':
        name = request.form.get('name')
        record_type = request.form.get('record_type')
        team_name = request.form.get('team_name')
        site_id = request.form.get('site')
        person_count = int(request.form.get('person_count', 1))
        highway_fee = float(request.form.get('highway_fee', 0))
        parking_fee = float(request.form.get('parking_fee', 0))

        # 查找或创建 member
        member = Member.query.filter_by(name=name).first()
        if not member:
            member = Member(name=name)
            db.session.add(member)
            db.session.commit()

        record = ExpenseRecord(
            date=datetime.now(),
            member_name=name,
            record_type=record_type,
            team_name=team_name if record_type == 'team' else None,
            site_id=site_id,
            person_count=person_count,
            highway_fee=highway_fee,
            parking_fee=parking_fee,
            user_id=current_user.id,
            member_id=member.id
        )
        db.session.add(record)
        db.session.commit()
        flash('记录已成功添加！', 'success')
        return redirect(url_for('dashboard'))

    sites = Site.query.all()
    return render_template('data_collection.html', sites=sites)

# 管理员路由
@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    users = User.query.all()
    teams = Team.query.all()
    sites = Site.query.all()
    records = ExpenseRecord.query.order_by(ExpenseRecord.date.desc()).all()
    
    return render_template('admin/dashboard.html',
                         users=users,
                         teams=teams,
                         sites=sites,
                         records=records)

# 数据导出路由
@app.route('/export/csv')
@login_required
def export_csv():
    records = ExpenseRecord.query.all()
    
    output = StringIO()
    writer = csv.writer(output)
    
    # 写入CSV头
    writer.writerow(['日期', '姓名', '团队', '现场', '高速费', '停车费', '总计'])
    
    # 写入数据
    for record in records:
        writer.writerow([
            record.date.strftime('%Y-%m-%d'),
            record.member.name,
            record.member.team.name if record.member.team else '个人',
            record.site.name,
            record.highway_fee,
            record.parking_fee,
            record.highway_fee + record.parking_fee
        ])
    
    output.seek(0)
    return send_file(
        output,
        mimetype='text/csv',
        as_attachment=True,
        download_name='expense_records.csv'
    )

if __name__ == '__main__':
    app.run(debug=True)