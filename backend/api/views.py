from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate, get_user_model
import secrets

from .models import (
    BankAccount, BankMovement,
    Contact, Item,
    Purchase, InventoryEntry,
    Sale, Payment,
    ExchangeRate, EngineReport,
    RegistrationPerson,
)
from .serializers import (
    BankAccountSerializer, BankMovementSerializer,
    ContactSerializer, ItemSerializer,
    PurchaseSerializer, InventoryEntrySerializer,
    SaleSerializer, PaymentSerializer,
    ExchangeRateSerializer, EngineReportSerializer,
    RegistrationPersonSerializer, RegistrationPersonCreateSerializer, RegisterUserWithTokenSerializer,
)


# ══════════════════════════════════════════════════════════════════════════════
# AUTENTICACIÓN
# ══════════════════════════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Usuario y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)

    if not user:
        return Response(
            {'error': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    if not user.is_active:
        return Response(
            {'error': 'Cuenta desactivada'},
            status=status.HTTP_403_FORBIDDEN
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id':         user.id,
            'username':   user.username,
            'email':      user.email,
            'role':       user.role,
            'first_name': user.first_name,
            'last_name':  user.last_name,
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
    except Exception:
        pass
    return Response({'message': 'Sesión cerrada correctamente'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        'id':         user.id,
        'username':   user.username,
        'email':      user.email,
        'role':       user.role,
        'first_name': user.first_name,
        'last_name':  user.last_name,
        'is_staff':   user.is_staff,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    serializer = TokenRefreshSerializer(data=request.data)
    try:
        serializer.is_valid(raise_exception=True)
    except TokenError as e:
        raise InvalidToken(e.args[0])
    return Response(serializer.validated_data)


# ══════════════════════════════════════════════════════════════════════════════
# BANCO
# ══════════════════════════════════════════════════════════════════════════════

class BankAccountListCreate(generics.ListCreateAPIView):
    queryset         = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    search_fields    = ('bank_name', 'account_number')


class BankAccountDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = BankAccount.objects.all()
    serializer_class = BankAccountSerializer


class BankMovementListCreate(generics.ListCreateAPIView):
    queryset         = BankMovement.objects.select_related('account').all()
    serializer_class = BankMovementSerializer
    filterset_fields = ('account',)
    search_fields    = ('reference', 'movement_number')
    ordering_fields  = ('operation_date', 'amount')


class BankMovementDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = BankMovement.objects.all()
    serializer_class = BankMovementSerializer


# ══════════════════════════════════════════════════════════════════════════════
# CONTACTOS
# ══════════════════════════════════════════════════════════════════════════════

class ContactListCreate(generics.ListCreateAPIView):
    queryset         = Contact.objects.all()
    serializer_class = ContactSerializer
    filterset_fields = ('category',)
    search_fields    = ('name', 'ruc_dni', 'business_name', 'email')


class ContactDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Contact.objects.all()
    serializer_class = ContactSerializer


# ══════════════════════════════════════════════════════════════════════════════
# ÍTEMS
# ══════════════════════════════════════════════════════════════════════════════

class ItemListCreate(generics.ListCreateAPIView):
    queryset         = Item.objects.all()
    serializer_class = ItemSerializer
    filterset_fields = ('category',)
    search_fields    = ('code', 'description')


class ItemDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Item.objects.all()
    serializer_class = ItemSerializer


# ══════════════════════════════════════════════════════════════════════════════
# COMPRAS
# ══════════════════════════════════════════════════════════════════════════════

class PurchaseListCreate(generics.ListCreateAPIView):
    queryset         = Purchase.objects.select_related('contact').prefetch_related('details').all()
    serializer_class = PurchaseSerializer
    filterset_fields = ('status',)
    search_fields    = ('voucher_number',)


class PurchaseDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Purchase.objects.all()
    serializer_class = PurchaseSerializer


# ══════════════════════════════════════════════════════════════════════════════
# INVENTARIO
# ══════════════════════════════════════════════════════════════════════════════

class InventoryListCreate(generics.ListCreateAPIView):
    queryset         = InventoryEntry.objects.select_related('item').all()
    serializer_class = InventoryEntrySerializer
    search_fields    = ('item__code', 'item__description')


class InventoryDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = InventoryEntry.objects.all()
    serializer_class = InventoryEntrySerializer


# ══════════════════════════════════════════════════════════════════════════════
# VENTAS
# ══════════════════════════════════════════════════════════════════════════════

class SaleListCreate(generics.ListCreateAPIView):
    queryset         = Sale.objects.select_related('contact').prefetch_related('details').all()
    serializer_class = SaleSerializer
    filterset_fields = ('status',)
    search_fields    = ('voucher_number',)


class SaleDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Sale.objects.all()
    serializer_class = SaleSerializer


# ══════════════════════════════════════════════════════════════════════════════
# PAGOS
# ══════════════════════════════════════════════════════════════════════════════

class PaymentListCreate(generics.ListCreateAPIView):
    queryset         = Payment.objects.select_related('contact').all()
    serializer_class = PaymentSerializer
    filterset_fields = ('category',)
    search_fields    = ('detail',)


class PaymentDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Payment.objects.all()
    serializer_class = PaymentSerializer


# ══════════════════════════════════════════════════════════════════════════════
# TIPO DE CAMBIO
# ══════════════════════════════════════════════════════════════════════════════

class ExchangeRateListCreate(generics.ListCreateAPIView):
    queryset         = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer
    ordering_fields  = ('date',)


class ExchangeRateDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer


# ══════════════════════════════════════════════════════════════════════════════
# REPORTES
# ══════════════════════════════════════════════════════════════════════════════

class EngineReportListCreate(generics.ListCreateAPIView):
    queryset         = EngineReport.objects.all()
    serializer_class = EngineReportSerializer
    ordering_fields  = ('date', 'hourmeter')


class EngineReportDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset         = EngineReport.objects.all()
    serializer_class = EngineReportSerializer

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

# ══════════════════════════════════════════════════════════════════════════════
# PERSONAS + TOKEN DE REGISTRO
# ══════════════════════════════════════════════════════════════════════════════

class RegistrationPersonListCreate(generics.ListCreateAPIView):
    queryset = RegistrationPerson.objects.select_related('created_by').all()
    search_fields = ('full_name', 'email', 'token')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RegistrationPersonCreateSerializer
        return RegistrationPersonSerializer

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            token=secrets.token_urlsafe(24),
        )


class RegistrationPersonDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = RegistrationPerson.objects.select_related('created_by').all()
    serializer_class = RegistrationPersonSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_registration_token(request, pk):
    try:
        person = RegistrationPerson.objects.get(pk=pk)
    except RegistrationPerson.DoesNotExist:
        return Response({'error': 'Persona no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    person.token = secrets.token_urlsafe(24)
    person.token_used = False
    person.save(update_fields=['token', 'token_used'])

    return Response({'id': person.id, 'token': person.token, 'token_used': person.token_used})


@api_view(['POST'])
@permission_classes([AllowAny])
def register_with_token(request):
    serializer = RegisterUserWithTokenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    token = serializer.validated_data['token'].strip()
    username = serializer.validated_data['username'].strip()
    password = serializer.validated_data['password']

    try:
        person = RegistrationPerson.objects.get(token=token)
    except RegistrationPerson.DoesNotExist:
        return Response({'error': 'Token inválido'}, status=status.HTTP_400_BAD_REQUEST)

    if person.token_used:
        return Response({'error': 'Este token ya fue utilizado'}, status=status.HTTP_400_BAD_REQUEST)

    UserModel = get_user_model()
    if UserModel.objects.filter(username=username).exists():
        return Response({'error': 'El usuario ya existe'}, status=status.HTTP_400_BAD_REQUEST)

    if UserModel.objects.filter(email=person.email).exists():
        return Response({'error': 'Ya existe una cuenta para este correo'}, status=status.HTTP_400_BAD_REQUEST)

    user = UserModel.objects.create_user(
        username=username,
        email=person.email,
        password=password,
        first_name=serializer.validated_data.get('first_name', '').strip(),
        last_name=serializer.validated_data.get('last_name', '').strip(),
        role=person.role,
    )

    person.token_used = True
    person.save(update_fields=['token_used'])

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Registro completado',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    }, status=status.HTTP_201_CREATED)