const fs = require('fs');
const file = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `          const parsed = JSON.parse(storedMCD);
          // If old format (object instead of array), reset
          if (parsed.length > 0 && !Array.isArray(parsed[0].giaCong)) {
            setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);
            localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
          } else {
            setDsMauCongDoan(parsed);
          }
        } catch {
          setDsMauCongDoan([]);
        }
      } else {
        setDsMauCongDoan([]);
        localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
      }`;

const replacement = `          const parsed = JSON.parse(storedMCD);
          if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0].giaCong)) {
            const missingDefaults = DEFAULT_MAU_CONG_DOAN.filter(
              d => !parsed.some((p) => p.id === d.id)
            );
            if (missingDefaults.length > 0) {
              const merged = [...missingDefaults, ...parsed];
              setDsMauCongDoan(merged);
              localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(merged));
            } else {
              setDsMauCongDoan(parsed);
            }
          } else {
            setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);
            localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
          }
        } catch {
          setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);
          localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
        }
      } else {
        setDsMauCongDoan(DEFAULT_MAU_CONG_DOAN);
        localStorage.setItem(STORAGE_KEY_MCD, JSON.stringify(DEFAULT_MAU_CONG_DOAN));
      }`;

const normalize = s => s.replace(/\r\n/g, '\n');
content = normalize(content);

if (content.includes(target)) {
    content = content.replace(target, replacement);
    // Write back with CRLF if needed, but modern bundlers handle LF fine
    fs.writeFileSync(file, content);
    console.log("Replaced successfully");
} else {
    console.log("Target not found");
}
