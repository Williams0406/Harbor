from django.contrib.auth.models import AbstractUser
from django.db import models


# ══════════════════════════════════════════════════════════════════════════════
# USUARIOS
# ══════════════════════════════════════════════════════════════════════════════

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin',    'Administrador'),
        ('operator', 'Operador'),
        ('viewer',   'Solo lectura'),
    ]
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='operator', verbose_name='Rol')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'


# ══════════════════════════════════════════════════════════════════════════════
# BANCO
# ══════════════════════════════════════════════════════════════════════════════

class BankAccount(models.Model):
    bank_name      = models.CharField(max_length=100, verbose_name='Banco')
    account_number = models.CharField(max_length=20, unique=True, verbose_name='Número de cuenta')
    cci            = models.CharField(max_length=20, blank=True, verbose_name='CCI')
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Cuenta bancaria'
        verbose_name_plural = 'Cuentas bancarias'
        ordering            = ['bank_name']

    def __str__(self):
        return f'{self.bank_name} — {self.account_number}'


class BankMovement(models.Model):
    account         = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='movements', verbose_name='Cuenta')
    operation_date  = models.DateField(verbose_name='Fecha de operación')
    value_date      = models.DateField(verbose_name='Fecha valor')
    reference       = models.CharField(max_length=200, blank=True, verbose_name='Referencia')
    amount          = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='Importe')
    itf             = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='ITF')
    movement_number = models.CharField(max_length=50, blank=True, verbose_name='Número de movimiento')
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Movimiento bancario'
        verbose_name_plural = 'Movimientos bancarios'
        ordering            = ['-operation_date']

    def __str__(self):
        return f'{self.account} | {self.operation_date} | {self.amount}'


# ══════════════════════════════════════════════════════════════════════════════
# CONTACTOS
# ══════════════════════════════════════════════════════════════════════════════

class Contact(models.Model):
    CATEGORY_CHOICES = [
        ('buyer',  'Comprador'),
        ('seller', 'Vendedor'),
    ]
    category      = models.CharField(max_length=10, choices=CATEGORY_CHOICES, verbose_name='Categoría')
    name          = models.CharField(max_length=200, verbose_name='Nombre')
    phone         = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    email         = models.EmailField(blank=True, verbose_name='Correo')
    ruc_dni       = models.CharField(max_length=20, blank=True, verbose_name='RUC / DNI')
    business_name = models.CharField(max_length=200, blank=True, verbose_name='Razón social')
    reference     = models.TextField(blank=True, verbose_name='Referencia')
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Contacto'
        verbose_name_plural = 'Contactos'
        ordering            = ['name']

    def __str__(self):
        return f'{self.name} ({self.get_category_display()})'


# ══════════════════════════════════════════════════════════════════════════════
# ÍTEMS
# ══════════════════════════════════════════════════════════════════════════════

class Item(models.Model):
    CATEGORY_CHOICES = [
        ('service', 'Servicio'),
        ('product', 'Producto'),
    ]
    category    = models.CharField(max_length=10, choices=CATEGORY_CHOICES, verbose_name='Categoría')
    code        = models.CharField(max_length=50, unique=True, verbose_name='Código')
    description = models.TextField(verbose_name='Descripción')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Ítem'
        verbose_name_plural = 'Ítems'
        ordering            = ['code']

    def __str__(self):
        return f'[{self.code}] {self.description[:60]}'


# ══════════════════════════════════════════════════════════════════════════════
# COMPRAS
# ══════════════════════════════════════════════════════════════════════════════

class Purchase(models.Model):
    STATUS_CHOICES = [
        ('pending',    'Pendiente'),
        ('in_process', 'En proceso'),
        ('cancelled',  'Cancelado'),
    ]
    voucher_type   = models.CharField(max_length=50, verbose_name='Tipo de comprobante')
    voucher_number = models.CharField(max_length=50, verbose_name='Número de comprobante')
    status         = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending', verbose_name='Estado')
    contact        = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchases', verbose_name='Contacto')
    voucher_pdf    = models.FileField(upload_to='purchases/vouchers/', null=True, blank=True, verbose_name='Comprobante PDF')
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Compra'
        verbose_name_plural = 'Compras'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.voucher_type} {self.voucher_number} — {self.get_status_display()}'


class PurchaseDetail(models.Model):
    purchase   = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='details', verbose_name='Compra')
    item       = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_details', verbose_name='Ítem')
    quantity   = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Cantidad')
    detail     = models.TextField(blank=True, verbose_name='Detalle')

    class Meta:
        verbose_name        = 'Detalle de compra'
        verbose_name_plural = 'Detalles de compra'

    def __str__(self):
        return f'{self.purchase} — {self.item}'


class PurchaseReport(models.Model):
    """Informe PDF adjunto al detalle — pueden existir múltiples."""
    purchase_detail = models.ForeignKey(PurchaseDetail, on_delete=models.CASCADE, related_name='reports', verbose_name='Detalle')
    report_pdf      = models.FileField(upload_to='purchases/reports/', verbose_name='Informe PDF')
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Informe de compra'
        verbose_name_plural = 'Informes de compra'

    def __str__(self):
        return f'Informe {self.purchase_detail} — {self.created_at.date()}'


# ══════════════════════════════════════════════════════════════════════════════
# INVENTARIO
# ══════════════════════════════════════════════════════════════════════════════

class InventoryEntry(models.Model):
    item       = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='inventory_entries', verbose_name='Ítem')
    quantity   = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Cantidad')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Entrada de inventario'
        verbose_name_plural = 'Entradas de inventario'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.item} — {self.quantity}'


# ══════════════════════════════════════════════════════════════════════════════
# VENTAS
# ══════════════════════════════════════════════════════════════════════════════

class Sale(models.Model):
    STATUS_CHOICES = [
        ('pending',    'Pendiente'),
        ('in_process', 'En proceso'),
        ('cancelled',  'Cancelado'),
    ]
    voucher_type   = models.CharField(max_length=50, verbose_name='Tipo de comprobante')
    voucher_number = models.CharField(max_length=50, verbose_name='Número de comprobante')
    status         = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending', verbose_name='Estado')
    contact        = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales', verbose_name='Contacto')
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Venta'
        verbose_name_plural = 'Ventas'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.voucher_type} {self.voucher_number} — {self.get_status_display()}'


class SaleDetail(models.Model):
    sale     = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='details', verbose_name='Venta')
    item     = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, blank=True, related_name='sale_details', verbose_name='Ítem')
    quantity = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Cantidad')

    class Meta:
        verbose_name        = 'Detalle de venta'
        verbose_name_plural = 'Detalles de venta'

    def __str__(self):
        return f'{self.sale} — {self.item}'


# ══════════════════════════════════════════════════════════════════════════════
# PAGOS
# ══════════════════════════════════════════════════════════════════════════════

class Payment(models.Model):
    CATEGORY_CHOICES = [
        ('expense', 'Egreso'),
        ('income',  'Ingreso'),
    ]
    detail       = models.TextField(verbose_name='Detalle')
    category     = models.CharField(max_length=10, choices=CATEGORY_CHOICES, verbose_name='Categoría')
    voucher_type = models.CharField(max_length=50, blank=True, verbose_name='Tipo de comprobante')
    amount       = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='Monto')
    contact      = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments', verbose_name='Contacto')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.get_category_display()} | {self.amount} — {self.detail[:50]}'


class PaymentItem(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='items', verbose_name='Pago')
    item    = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_items', verbose_name='Ítem')

    class Meta:
        verbose_name        = 'Ítem de pago'
        verbose_name_plural = 'Ítems de pago'

    def __str__(self):
        return f'{self.payment} — {self.item}'


# ══════════════════════════════════════════════════════════════════════════════
# TIPO DE CAMBIO
# ══════════════════════════════════════════════════════════════════════════════

class ExchangeRate(models.Model):
    date        = models.DateField(unique=True, verbose_name='Fecha')
    buy_dollar  = models.DecimalField(max_digits=10, decimal_places=4, verbose_name='Compra dólar')
    sell_dollar = models.DecimalField(max_digits=10, decimal_places=4, verbose_name='Venta dólar')
    buy_euro    = models.DecimalField(max_digits=10, decimal_places=4, verbose_name='Compra euro')
    sell_euro   = models.DecimalField(max_digits=10, decimal_places=4, verbose_name='Venta euro')

    class Meta:
        verbose_name        = 'Tipo de cambio'
        verbose_name_plural = 'Tipos de cambio'
        ordering            = ['-date']

    def __str__(self):
        return f'{self.date} | USD {self.buy_dollar}/{self.sell_dollar} | EUR {self.buy_euro}/{self.sell_euro}'


# ══════════════════════════════════════════════════════════════════════════════
# REPORTE DE MOTOR
# ══════════════════════════════════════════════════════════════════════════════

class EngineReport(models.Model):
    # General
    date         = models.DateField(verbose_name='Fecha')
    hourmeter    = models.DecimalField(max_digits=10, decimal_places=1, verbose_name='Horómetro')
    rpm_speed    = models.DecimalField(max_digits=8,  decimal_places=1, verbose_name='Velocidad RPM')
    knot_speed   = models.DecimalField(max_digits=8,  decimal_places=2, verbose_name='Velocidad nudos')
    fish_in_hold = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Pesca en bodega')

    # Temperaturas y presiones principales
    ambient_temp_engine_room = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. ambiente sala máquinas')
    intake_air_temp          = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. aire admisión')
    exhaust_pipe_temp        = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. tubo de escape')
    oil_pressure             = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Presión aceite')
    oil_temp_crankcase       = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. aceite cárter')
    engine_coolant_temp      = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. refrigerante motor')
    damper_temp              = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. damper')
    boost_pressure           = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Presión boots')

    # Aceite motor
    engine_oil_level  = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Nivel aceite motor')
    refill_engine_oil = models.BooleanField(default=False, verbose_name='Rellenar aceite motor')

    # Bomba de refrigerante
    coolant_pump_pressure = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Presión bomba refrigerante')

    # Aftercooler
    aftercooler_coolant_inlet_temp  = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. entrada refrigerante aftercooler')
    aftercooler_coolant_outlet_temp = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. salida refrigerante aftercooler')

    # Camisas
    liner_coolant_inlet_temp  = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. entrada refrigerante a las camisas')
    liner_coolant_outlet_temp = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. salida refrigerante a las camisas')

    # Caja de transmisión — refrigerante
    gearbox_coolant_inlet_temp  = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. entrada refrigerante caja transmisión')
    gearbox_coolant_outlet_temp = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. salida refrigerante caja transmisión')

    # Temperatura escape por cilindro
    exhaust_temp_cyl_1 = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. escape cilindro #1')
    exhaust_temp_cyl_2 = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. escape cilindro #2')
    exhaust_temp_cyl_3 = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. escape cilindro #3')
    exhaust_temp_cyl_4 = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. escape cilindro #4')
    exhaust_temp_cyl_5 = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. escape cilindro #5')
    exhaust_temp_cyl_6 = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. escape cilindro #6')

    # Caja de transmisión — aceite
    gearbox_oil_pressure = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Presión aceite caja transmisión')
    gearbox_oil_temp     = models.DecimalField(max_digits=6, decimal_places=2, verbose_name='Temp. aceite caja transmisión')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Reporte de motor'
        verbose_name_plural = 'Reportes de motor'
        ordering            = ['-date']

    def __str__(self):
        return f'Reporte {self.date} — {self.hourmeter}h — {self.rpm_speed} RPM'