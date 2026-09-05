const fs = require('fs');
const path = 'f:/Tool/mimin-erp/apps/web/src/components/LenhCatModal.tsx';
let content = fs.readFileSync(path, 'utf8');
const target = `                                    } catch (e) {
                                      console.error("Lỗi parse dsMau khi chọn SP:", e);
                                    }
                                    }
                                    toast.success`;
const replacement = `                                    } catch (e) {
                                      console.error("Lỗi parse dsMau khi chọn SP:", e);
                                    }
                                    toast.success`;
content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log('Fixed syntax error');
