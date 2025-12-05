{ pkgs }: {
  packages = [
    pkgs.nodejs_20
    pkgs.corepack_latest
    pkgs.yarn
  ];
}