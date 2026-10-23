# Prueba de mutación: rompe el servidor a propósito, una cosa a la vez, y comprueba que las pruebas lo detectan.
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$srv = Join-Path $raiz 'server.js'
$orig = [IO.File]::ReadAllText($srv)
$casos = @(
  @('ignorar la revocación en la sesión', 'inv.revoked || inv.expires < ahora()) return null', 'inv.expires < ahora()) return null'),
  @('ignorar el vencimiento del enlace', 'if (!(exp > ahora()) || ', 'if ('),
  @('quitar la cabecera noindex', "'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',", ''),
  @('quitar la exigencia de sesión', "if (!s) { log({ evento: 'sin_acceso', ruta: p.slice(0, 40) }); return out(res, 401, 'Acceso solo por invitación.'); }", '')
)
foreach ($c in $casos) {
  $i = $orig.IndexOf($c[1])
  if ($i -lt 0) { "NO ENCONTRADO: $($c[0])"; continue }
  [IO.File]::WriteAllText($srv, $orig.Substring(0, $i) + $c[2] + $orig.Substring($i + $c[1].Length))
  $r = node --test --test-timeout=20000 (Join-Path $raiz 'test\reclamo.test.js') 2>&1 | Select-String -Pattern '^ℹ fail'
  "{0,-40} -> {1}" -f $c[0], $r.Line
}
[IO.File]::WriteAllText($srv, $orig)
"restaurado: " + ((node --test --test-timeout=20000 (Join-Path $raiz 'test\reclamo.test.js') 2>&1 | Select-String -Pattern '^ℹ (pass|fail)') -join ' ')
