{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  name = "pixelfed-nix-shell";
  buildInputs = with pkgs; [ ffmpeg-full nodejs nodePackages.npm ungoogled-chromium imagemagick ];
  runScript = "$SHELL";
  
  shellHook = ''
      export PATH="$PWD/node_modules/.bin/:$PATH"
      export CHROMIUM_PATH=$(which chromium)
      export FFMPEG_PATH=$(which ffmpeg)
  '';
}
