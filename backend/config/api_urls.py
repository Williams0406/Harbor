from django.urls import path
from api import views

urlpatterns = [
    # ── Autenticación ─────────────────────────────────────────────────────────
    path('auth/login/',         views.login,         name='auth_login'),
    path('auth/logout/',        views.logout,        name='auth_logout'),
    path('auth/me/',            views.me,            name='auth_me'),
    path('auth/token/refresh/', views.token_refresh, name='token_refresh'),

    # ── Banco ─────────────────────────────────────────────────────────────────
    path('bank/accounts/',           views.BankAccountListCreate.as_view(),  name='bank_accounts'),
    path('bank/accounts/<int:pk>/',  views.BankAccountDetail.as_view(),      name='bank_account_detail'),
    path('bank/movements/',          views.BankMovementListCreate.as_view(), name='bank_movements'),
    path('bank/movements/<int:pk>/', views.BankMovementDetail.as_view(),     name='bank_movement_detail'),

    # ── Contactos ─────────────────────────────────────────────────────────────
    path('contacts/',          views.ContactListCreate.as_view(), name='contacts'),
    path('contacts/<int:pk>/', views.ContactDetail.as_view(),     name='contact_detail'),

    # ── Ítems ─────────────────────────────────────────────────────────────────
    path('items/',          views.ItemListCreate.as_view(), name='items'),
    path('items/<int:pk>/', views.ItemDetail.as_view(),     name='item_detail'),

    # ── Compras ───────────────────────────────────────────────────────────────
    path('purchases/',          views.PurchaseListCreate.as_view(), name='purchases'),
    path('purchases/<int:pk>/', views.PurchaseDetail.as_view(),     name='purchase_detail'),

    # ── Inventario ────────────────────────────────────────────────────────────
    path('inventory/',          views.InventoryListCreate.as_view(), name='inventory'),
    path('inventory/<int:pk>/', views.InventoryDetail.as_view(),     name='inventory_detail'),

    # ── Ventas ────────────────────────────────────────────────────────────────
    path('sales/',          views.SaleListCreate.as_view(), name='sales'),
    path('sales/<int:pk>/', views.SaleDetail.as_view(),     name='sale_detail'),

    # ── Pagos ─────────────────────────────────────────────────────────────────
    path('payments/',          views.PaymentListCreate.as_view(), name='payments'),
    path('payments/<int:pk>/', views.PaymentDetail.as_view(),     name='payment_detail'),

    # ── Tipo de cambio ────────────────────────────────────────────────────────
    path('exchange-rates/',          views.ExchangeRateListCreate.as_view(), name='exchange_rates'),
    path('exchange-rates/<int:pk>/', views.ExchangeRateDetail.as_view(),     name='exchange_rate_detail'),

    # ── Reportes ──────────────────────────────────────────────────────────────
    path('reports/',          views.EngineReportListCreate.as_view(), name='reports'),
    path('reports/<int:pk>/', views.EngineReportDetail.as_view(),     name='report_detail'),
]