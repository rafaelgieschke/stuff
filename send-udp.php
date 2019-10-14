<?php
$ip = $_GET["ip"];
$port = $_GET["port"];

$sock = fsockopen("udp://" . long2ip(ip2long($ip)), intval($port));
fputs($sock, "+");
fclose($sock);
