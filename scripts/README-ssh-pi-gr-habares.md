# Conectar por SSH a Raspberry Pi GR-HABARES (sin contraseña)

Como no pusiste contraseña al crear la imagen, la única forma de entrar es **escribir tu clave SSH en la tarjeta** desde el Mac.

## Pasos (con la Raspberry apagada)

1. **Saca la tarjeta SD** de la Raspberry e **insértala en el Mac**.

2. **En Terminal, ejecuta** (te pedirá la contraseña de tu usuario de Mac):
   ```bash
   sudo /Users/juancarlosparra/Projects/AppBodasdehoy.com/scripts/pi-authorized-keys-on-sd.sh
   ```

3. **Expulsa la tarjeta** (el script te dirá el comando; si no, suele ser):
   ```bash
   diskutil eject /dev/disk4
   ```

4. **Pon la tarjeta en la Raspberry**, enciéndela y espera 1–2 minutos.

5. **Conecta por SSH** (ya no pedirá contraseña):
   ```bash
   ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedAlgorithms=+ssh-rsa pi@192.168.1.90
   ```

## Si la tarjeta es otro disco

Si al ejecutar el script dice que el dispositivo no existe, mira el número de disco con:
```bash
diskutil list
```
Busca la línea de **125.7 GB** (external). Si es `disk5`, ejecuta:
```bash
sudo /Users/juancarlosparra/Projects/AppBodasdehoy.com/scripts/pi-authorized-keys-on-sd.sh /dev/rdisk5s2
```

## Sobre "Connection closed" o "Permission denied"

- Si antes te cerraba la conexión, puede ser bloqueo temporal por muchos intentos fallidos. **Apaga la Pi**, haz los pasos de arriba con la tarjeta en el Mac y al arrancar de nuevo entrarás con la clave.
- `raspberrypi.local` no resuelve en tu red; usa la IP **192.168.1.90**.
