from rest_framework import serializers
from .models import (
    BankAccount, BankMovement,
    Contact, Item,
    Purchase, PurchaseDetail, PurchaseReport,
    InventoryEntry,
    Sale, SaleDetail,
    Payment, PaymentItem,
    ExchangeRate, EngineReport,
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