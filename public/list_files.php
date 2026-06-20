<?php
header('Content-Type: text/plain');
echo "=== PUBLIC_HTML FILES ===\n";
$files = scandir(dirname(__DIR__));
foreach ($files as $file) {
    $full = dirname(__DIR__) . '/' . $file;
    echo $file . (is_dir($full) ? "/" : "") . " (" . filesize($full) . " bytes)\n";
}

echo "\n=== PUBLIC/ FILES ===\n";
$pfiles = scandir(__DIR__);
foreach ($pfiles as $file) {
    $full = __DIR__ . '/' . $file;
    echo $file . (is_dir($full) ? "/" : "") . "\n";
}

$distDir = dirname(__DIR__) . '/dist';
if (is_dir($distDir)) {
    echo "\n=== DIST FILES ===\n";
    $dist_files = scandir($distDir);
    foreach ($dist_files as $file) {
        echo $file . (is_dir($distDir . '/' . $file) ? "/" : "") . "\n";
    }
} else {
    echo "\ndist/ folder does not exist at " . $distDir . "\n";
}
?>
