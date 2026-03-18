from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
import secrets

from api.models import RegistrationPerson


class Command(BaseCommand):
    help = 'Crea una sola vez un usuario vinculado a una RegistrationPerson existente o crea ambos automáticamente.'

    def add_arguments(self, parser):
        parser.add_argument('--person-id', type=int, help='ID de la persona registrada')
        parser.add_argument('--username', default='Administracion', help='Nombre de usuario a crear')
        parser.add_argument('--password', default='Admin042026', help='Contraseña del usuario')
        parser.add_argument('--first-name', default='Administración', help='Nombres del usuario')
        parser.add_argument('--last-name', default='General', help='Apellidos del usuario')
        parser.add_argument('--full-name', default='Administración General', help='Nombre completo de la persona')
        parser.add_argument('--email', default='administracion@harbor.local', help='Correo de la persona')
        parser.add_argument('--phone', default='+51 999 000 111', help='Teléfono de la persona')
        parser.add_argument('--role', default='admin', choices=['admin', 'operator', 'viewer'], help='Rol a asignar')

    def handle(self, *args, **options):
        User = get_user_model()

        username = options['username'].strip()
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING('El usuario ya existe. Saltando creación.'))
            return

        person_id = options.get('person_id')
        if person_id:
            try:
                person = RegistrationPerson.objects.get(pk=person_id)
            except RegistrationPerson.DoesNotExist as exc:
                raise CommandError('La persona indicada no existe.') from exc
        else:
            person, created = RegistrationPerson.objects.get_or_create(
                email=options['email'].strip(),
                defaults={
                    'full_name': options['full_name'].strip(),
                    'phone': options['phone'].strip(),
                    'role': options['role'],
                    'token': secrets.token_urlsafe(24),
                    'token_used': False,
                },
            )
            if not created and person.linked_user_id:
                self.stdout.write(self.style.WARNING('La persona ya tiene usuario vinculado. Saltando.'))
                return

        if person.linked_user_id:
            raise CommandError('Esta persona ya tiene un usuario vinculado. Este script solo puede usarse una vez por persona.')

        if User.objects.filter(email=person.email).exists():
            raise CommandError('Ya existe un usuario con el correo de esta persona.')

        user = User.objects.create_user(
            username=username,
            email=person.email,
            password=options['password'],
            first_name=options['first_name'].strip(),
            last_name=options['last_name'].strip(),
            role=person.role if person.role else options['role'],
        )

        person.linked_user = user
        person.token_used = True
        person.save(update_fields=['linked_user', 'token_used'])

        self.stdout.write(self.style.SUCCESS(
            f'Usuario "{user.username}" creado y vinculado correctamente a la persona #{person.id}.'
        ))