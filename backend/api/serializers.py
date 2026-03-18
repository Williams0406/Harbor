from rest_framework import serializers
from .models import (
    BankAccount, BankMovement,
    Contact, Item,
    Purchase, PurchaseDetail, PurchaseReport,
    InventoryEntry,
    Sale, SaleDetail,
    Payment, PaymentItem,
    ExchangeRate, EngineReport,
    RegistrationPerson,
)


# ── Banco ─────────────────────────────────────────────────────────────────────

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BankAccount
        fields = '__all__'


class BankMovementSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.bank_name', read_only=True)

    class Meta:
        model  = BankMovement
        fields = '__all__'


# ── Contactos ─────────────────────────────────────────────────────────────────

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Contact
        fields = '__all__'


# ── Ítems ─────────────────────────────────────────────────────────────────────

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Item
        fields = '__all__'


# ── Compras ───────────────────────────────────────────────────────────────────

class PurchaseReportSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PurchaseReport
        fields = '__all__'


class PurchaseDetailSerializer(serializers.ModelSerializer):
    reports   = PurchaseReportSerializer(many=True, read_only=True)
    item_code = serializers.CharField(source='item.code', read_only=True)

    class Meta:
        model  = PurchaseDetail
        fields = '__all__'


class PurchaseSerializer(serializers.ModelSerializer):
    details      = PurchaseDetailSerializer(many=True, read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)

    class Meta:
        model  = Purchase
        fields = '__all__'


# ── Inventario ────────────────────────────────────────────────────────────────

class InventoryEntrySerializer(serializers.ModelSerializer):
    item_code        = serializers.CharField(source='item.code', read_only=True)
    item_description = serializers.CharField(source='item.description', read_only=True)

    class Meta:
        model  = InventoryEntry
        fields = '__all__'


# ── Ventas ────────────────────────────────────────────────────────────────────

class SaleDetailSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='item.code', read_only=True)

    class Meta:
        model  = SaleDetail
        fields = '__all__'


class SaleSerializer(serializers.ModelSerializer):
    details      = SaleDetailSerializer(many=True, read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)

    class Meta:
        model  = Sale
        fields = '__all__'


# ── Pagos ─────────────────────────────────────────────────────────────────────

class PaymentItemSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='item.code', read_only=True)

    class Meta:
        model  = PaymentItem
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    items        = PaymentItemSerializer(many=True, read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)

    class Meta:
        model  = Payment
        fields = '__all__'


# ── Tipo de cambio ────────────────────────────────────────────────────────────

class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ExchangeRate
        fields = '__all__'


# ── Reportes ──────────────────────────────────────────────────────────────────

class EngineReportSerializer(serializers.ModelSerializer):
    class Meta:
        model  = EngineReport
        fields = '__all__'
        # Todos los campos numéricos son opcionales — solo 'date' es requerido
        extra_kwargs = {
            'hourmeter':                       {'required': False, 'allow_null': True},
            'rpm_speed':                       {'required': False, 'allow_null': True},
            'knot_speed':                      {'required': False, 'allow_null': True},
            'fish_in_hold':                    {'required': False, 'allow_null': True},
            'ambient_temp_engine_room':        {'required': False, 'allow_null': True},
            'intake_air_temp':                 {'required': False, 'allow_null': True},
            'exhaust_pipe_temp':               {'required': False, 'allow_null': True},
            'oil_pressure':                    {'required': False, 'allow_null': True},
            'oil_temp_crankcase':              {'required': False, 'allow_null': True},
            'engine_coolant_temp':             {'required': False, 'allow_null': True},
            'damper_temp':                     {'required': False, 'allow_null': True},
            'boost_pressure':                  {'required': False, 'allow_null': True},
            'engine_oil_level':                {'required': False, 'allow_null': True},
            'refill_engine_oil':               {'required': False, 'allow_null': True},
            'coolant_pump_pressure':           {'required': False, 'allow_null': True},
            'aftercooler_coolant_inlet_temp':  {'required': False, 'allow_null': True},
            'aftercooler_coolant_outlet_temp': {'required': False, 'allow_null': True},
            'liner_coolant_inlet_temp':        {'required': False, 'allow_null': True},
            'liner_coolant_outlet_temp':       {'required': False, 'allow_null': True},
            'gearbox_coolant_inlet_temp':      {'required': False, 'allow_null': True},
            'gearbox_coolant_outlet_temp':     {'required': False, 'allow_null': True},
            'exhaust_temp_cyl_1':              {'required': False, 'allow_null': True},
            'exhaust_temp_cyl_2':              {'required': False, 'allow_null': True},
            'exhaust_temp_cyl_3':              {'required': False, 'allow_null': True},
            'exhaust_temp_cyl_4':              {'required': False, 'allow_null': True},
            'exhaust_temp_cyl_5':              {'required': False, 'allow_null': True},
            'exhaust_temp_cyl_6':              {'required': False, 'allow_null': True},
            'gearbox_oil_pressure':            {'required': False, 'allow_null': True},
            'gearbox_oil_temp':                {'required': False, 'allow_null': True},
        }

class RegistrationPersonSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    linked_user_username = serializers.CharField(source='linked_user.username', read_only=True)

    class Meta:
        model = RegistrationPerson
        fields = '__all__'
        read_only_fields = ('token', 'token_used', 'created_by', 'created_at', 'linked_user')


class RegistrationPersonCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistrationPerson
        fields = ('id', 'full_name', 'email', 'phone', 'role', 'token', 'token_used', 'created_by', 'created_at', 'linked_user')
        read_only_fields = ('token', 'token_used', 'created_by', 'created_at', 'linked_user')


class RegisterUserWithTokenSerializer(serializers.Serializer):
    token = serializers.CharField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)