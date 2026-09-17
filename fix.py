import sys

filename = 'apps/web/src/lib/data/lenh-cat-store.tsx'
with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

target = """          const parsed = JSON.parse(storedMCD);
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
      }"""

replacement = """          const parsed = JSON.parse(storedMCD);
          if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0].giaCong)) {
            const missingDefaults = DEFAULT_MAU_CONG_DOAN.filter(
              d => !parsed.some((p: any) => p.id === d.id)
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
      }"""

if target in content:
    content = content.replace(target, replacement)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found")
