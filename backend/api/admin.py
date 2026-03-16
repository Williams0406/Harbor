from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User,
    BankAccount, BankMovement,
    Contact, Item,
    Purchase, PurchaseDetail, PurchaseReport,
    InventoryEntry,
    Sale, SaleDetail,
    Payment, PaymentItem,
    ExchangeRate, EngineReport,
)


# ── Usuarios ──────────────────────────────────────────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'is_active')
    list_filter  = ('role', 'is_active', 'is_staff')
    fieldsets    = BaseUserAdmin.fieldsets + (
        ('Harbor Supplies', {'fields': ('role',)}),
    )


# ── Banco ─────────────────────────────────────────────────────────────────────
class BankMovementInline(admin.TabularInline):
    model  = BankMovement
    extra  = 0
    fields = ('operation_date', 'value_date', 'reference', 'amount', 'itf', 'movement_number')


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display  = ('bank_name', 'account_number', 'cci')
    search_fields = ('bank_name', 'account_number')
    inlines       = [BankMovementInline]


@admin.register(BankMovement)
class BankMovementAdmin(admin.ModelAdmin):
    list_display   = ('account', 'operation_date', 'amount', 'itf', 'reference')
    list_filter    = ('account',)
    date_hierarchy = 'operation_date'


# ── Contactos ─────────────────────────────────────────────────────────────────
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display  = ('name', 'category', 'ruc_dni', 'phone', 'email')
    list_filter   = ('category',)
    search_fields = ('name', 'ruc_dni', 'business_name')


# ── Ítems ─────────────────────────────────────────────────────────────────────
@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display  = ('code', 'category', 'description')
    list_filter   = ('category',)
    search_fields = ('code', 'description')


# ── Compras ───────────────────────────────────────────────────────────────────
class PurchaseReportInline(admin.TabularInline):
    model = PurchaseReport
    extra = 0


class PurchaseDetailInline(admin.StackedInline):
    model            = PurchaseDetail
    extra            = 0
    show_change_link = True


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display  = ('voucher_type', 'voucher_number', 'status', 'contact', 'created_at')
    list_filter   = ('status',)
    search_fields = ('voucher_number',)
    inlines       = [PurchaseDetailInline]


@admin.register(PurchaseDetail)
class PurchaseDetailAdmin(admin.ModelAdmin):
    list_display = ('purchase', 'item', 'quantity')
    inlines      = [PurchaseReportInline]


# ── Inventario ────────────────────────────────────────────────────────────────
@admin.register(InventoryEntry)
class InventoryEntryAdmin(admin.ModelAdmin):
    list_display  = ('item', 'quantity', 'created_at')
    search_fields = ('item__code', 'item__description')


# ── Ventas ────────────────────────────────────────────────────────────────────
class SaleDetailInline(admin.TabularInline):
    model = SaleDetail
    extra = 0


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display  = ('voucher_type', 'voucher_number', 'status', 'contact', 'created_at')
    list_filter   = ('status',)
    search_fields = ('voucher_number',)
    inlines       = [SaleDetailInline]


# ── Pagos ─────────────────────────────────────────────────────────────────────
class PaymentItemInline(admin.TabularInline):
    model = PaymentItem
    extra = 0


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('category', 'detail', 'amount', 'contact', 'created_at')
    list_filter  = ('category',)
    inlines      = [PaymentItemInline]


# ── Tipo de cambio ────────────────────────────────────────────────────────────
@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display   = ('date', 'buy_dollar', 'sell_dollar', 'buy_euro', 'sell_euro')
    date_hierarchy = 'date'


# ── Reportes ──────────────────────────────────────────────────────────────────
@admin.register(EngineReport)
class EngineReportAdmin(admin.ModelAdmin):
    list_display   = ('date', 'hourmeter', 'rpm_speed', 'knot_speed', 'oil_pressure', 'refill_engine_oil')
    date_hierarchy = 'date'
    list_filter    = ('refill_engine_oil',)
    fieldsets = (
        ('General', {
            'fields': ('date', 'hourmeter', 'rpm_speed', 'knot_speed', 'fish_in_hold')
        }),
        ('Temperaturas y presiones principales', {
            'fields': ('ambient_temp_engine_room', 'intake_air_temp', 'exhaust_pipe_temp',
                       'oil_pressure', 'oil_temp_crankcase', 'engine_coolant_temp',
                       'damper_temp', 'boost_pressure')
        }),
        ('Aceite motor', {
            'fields': ('engine_oil_level', 'refill_engine_oil')
        }),
        ('Sistema de refrigeración', {
            'fields': ('coolant_pump_pressure',
                       'aftercooler_coolant_inlet_temp', 'aftercooler_coolant_outlet_temp',
                       'liner_coolant_inlet_temp', 'liner_coolant_outlet_temp',
                       'gearbox_coolant_inlet_temp', 'gearbox_coolant_outlet_temp')
        }),
        ('Temperatura escape por cilindro', {
            'fields': ('exhaust_temp_cyl_1', 'exhaust_temp_cyl_2', 'exhaust_temp_cyl_3',
                       'exhaust_temp_cyl_4', 'exhaust_temp_cyl_5', 'exhaust_temp_cyl_6')
        }),
        ('Caja de transmisión', {
            'fields': ('gearbox_oil_pressure', 'gearbox_oil_temp')
        }),
    )