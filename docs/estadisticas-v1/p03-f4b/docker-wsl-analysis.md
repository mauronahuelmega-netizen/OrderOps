# Docker / WSL2

Datos efectivos en environment-baseline.json y current-resource-samples.json. Docker Desktop4.56.0(214940), cliente/motor29.1.3, backend kernel microsoft-standard-WSL2, cgroupv2, overlayfs para contenedores; PGDATA es volumen local/ext4 /dev/sde, no overlay writable layer. WSL3.0.3.0; Ubuntu y docker-desktop figuran Running versión2. Se consultó status, no se inició ninguna distribución.

Capacidad runtime motor4CPU/8.269.664.256 bytes (~7,70GiB), host4logicalCPU/15,89GiB visibles. PostgreSQL Memory=0/NanoCpus=0/CpuQuota=0 y cgroup memory.max=max/cpu.max='max100000': sin límite privado, sujeto al motor y competencia. nr_throttled=0 y OOM=0 son acumulados del cgroup de este contenedor; no prueban ausencia de scheduling wait ni OOM de otro recurso. Restarts=0, State.OOMKilled=false.

41 contenedores/26 running observados globalmente por docker info. No se inspeccionaron contenidos, configuración o bases de otros proyectos. Process names/IDs/CPU acumulativo muestran aplicaciones de escritorio y backend Docker presentes; CPU acumulativo no identifica un competidor activo durante queries. La existencia de Cursor no atribuye culpa ni autoriza detenerlo.

PSI /proc/pressure es **global del kernel/VM**, no presión exclusiva del contenedor. CPU some avg10=9,09–16,51% en reposo, I/O some0,97–1,12% y full0,34–0,55%, memoria some/full0. Estos porcentajes son tiempo de presión de tareas, no utilización CPU ni porcentaje de disco ocupado. Contenedor CPU0,00–0,01% y memoria1,57% simultáneamente aproximados. Muestreo espaciado13–20s por overhead de observadores; no continuo ni alineado a SQL.

MemFree Linux pequeño (~94MiB) coexiste con MemAvailable3,59GiB/caché recuperable; no interpretar MemFree aislado como agotamiento. Swap2GiB,464KiB usadas, sin tasa de swap disponible. Host freephysical4,21GiB/15,89GiB, no memory exhaustion actual demostrada. Contador Docker memoria no incluye de forma equivalente toda caché/WSL/host; no sumar categorías.

PGDATA en /var/lib/docker/volumes/... dentro de ext4 /dev/sde, 4% usado según df, espacio libre amplio. Eso no ubica físicamente el VHDX en disco Windows ni identifica SSD/HDD/latencia del host. DockerRootDir lógico /var/lib/docker no equivale al archivo VHDX. Ubicación física no determinada; ninguna exploración de proyectos o volúmenes ajenos.

No .wslconfig en perfil. settings-store.json solo expone preferencias generales; no recursos asignados explícitos en campos seleccionados. Capacidad runtime confirma recursos efectivos, sin afirmar que toda configuración Desktop haya sido inventariada. Hash de settings registrado; no contenido de credenciales publicado.

Limitación Windows: WMI capacidad y procesos disponibles, pero clases de performance no aportaron CPU/disk/memory rate válidos (null). Operación de comando exit0 no significa contador disponible. No inventar totalCPU ni tasaI/O; un experimento posterior deberá habilitar solo observación por otro proveedor existente, sin reparar configuración automáticamente.
