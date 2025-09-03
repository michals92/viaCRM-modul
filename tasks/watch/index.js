// index.js
import { exec } from "child_process";
import fs from "fs";
import archiver from "archiver";
import chokidar from "chokidar";

/**
 * @returns {Promise<void>}
 */
function runBuild() {
  return new Promise((resolve, reject) => {
    console.log("⚡ Running build...");
    exec("npm run build", (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Build failed:", stderr);
        return reject(err);
      }
      console.log("✅ Build done!");
      resolve(); // ✅ OK, TypeScript už netrvá na argumentu
    });
  });
}

/**
 * @returns {Promise<void>}
 */
function createZip(zipName = "build.zip") {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync("dist")) {
      console.error("❌ Build folder 'dist/' does not exist.");
      return reject(new Error("Build folder 'dist/' does not exist."));
    }

    console.log("📦 Creating zip...");

    const output = fs.createWriteStream(zipName);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ Zip created: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on("error", (err) => {
      console.error("❌ Archiving failed:", err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory("dist/", false);
    archive.finalize();
  });
}

/**
 * @returns {Promise<void>}
 */
function installToEspoDocker(zipName = "build.zip") {
  return new Promise((resolve, reject) => {
    // Zkopíruje ZIP do kontejneru
    const copyCmd = `docker cp ${zipName} espo:/var/www/html/${zipName}`;
    // Spustí instalaci v kontejru
    const installCmd = `docker exec espo php /var/www/html/command.php extension:install /var/www/html/${zipName} && docker exec espo php /var/www/html/command.php cache:clear`;

    exec(copyCmd, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Docker copy failed:", stderr);
        return reject(err);
      }
      console.log("✅ ZIP copied to Docker container.");
      exec(installCmd, (err2, stdout2, stderr2) => {
        if (err2) {
          console.error("❌ EspoCRM install failed:", stderr2);
          return reject(err2);
        }
        console.log("✅ EspoCRM module installed/updated and cache cleared.");
        resolve();
      });
    });
  });
}

function buildZipAndInstall() {
  runBuild()
    .then(() => createZip())
    .then(() => installToEspoDocker())
    .catch((err) => {
      console.error("❌ Error:", err);
    });
}

// Spustí build, zip a instalaci na začátku
buildZipAndInstall();

// Sleduje změny ve složce src a při změně spustí build, zip a instalaci do Dockeru
// Watcher pro EspoCRM modul – při změně v src rebuilduje, balí a instaluje do Dockeru
chokidar.watch("src", { ignoreInitial: true }).on("all", (event, path) => {
  console.log(`🔄 Detected change (${event}) in ${path}, rebuilding and installing...`);
  buildZipAndInstall();
});