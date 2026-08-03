#!/usr/bin/env python3
"""Fix lenh-cat/page.tsx — cast newChiPhi as Record<string, number> for dynamic key delete."""
import re
import sys
from pathlib import Path

PATH = Path("D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/app/(main)/lenh-cat/page.tsx")

OLD_1 = """                      <button onClick={() => {
                        setNewMauCP(prev => {
                          const newChiPhi = { ...prev.chiPhi };
                          delete newChiPhi[key];
                          return { ...prev, chiPhi: newChiPhi };
                        });
                      }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">"""

NEW_1 = """                      <button onClick={() => {
                        setNewMauCP(prev => {
                          const newChiPhi: Record<string, number> = { ...prev.chiPhi };
                          delete newChiPhi[key];
                          return { ...prev, chiPhi: newChiPhi as { baoBi: number; temNhan: number; khauHao: number } };
                        });
                      }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">"""

OLD_2 = """                      <input className="text-sm font-medium border-b border-dashed border-slate-300 focus:outline-none flex-1 bg-transparent" value={key} onChange={e => {
                        const newKey = e.target.value;
                        if (newKey && newKey !== key) {
                          setNewMauCP(prev => {
                            const newChiPhi = { ...prev.chiPhi };
                            const currentVal = newChiPhi[key];
                            delete newChiPhi[key];
                            newChiPhi[newKey] = currentVal;
                            return { ...prev, chiPhi: newChiPhi };
                          });
                        }
                      }} />"""

NEW_2 = """                      <input className="text-sm font-medium border-b border-dashed border-slate-300 focus:outline-none flex-1 bg-transparent" value={key} onChange={e => {
                        const newKey = e.target.value;
                        if (newKey && newKey !== key) {
                          setNewMauCP(prev => {
                            const newChiPhi: Record<string, number> = { ...prev.chiPhi };
                            const currentVal = newChiPhi[key];
                            delete newChiPhi[key];
                            newChiPhi[newKey] = currentVal;
                            return { ...prev, chiPhi: newChiPhi as { baoBi: number; temNhan: number; khauHao: number } };
                          });
                        }
                      }} />"""

text = PATH.read_text(encoding="utf-8")
if OLD_1 not in text:
    print("OLD_1 not found")
    sys.exit(1)
if OLD_2 not in text:
    print("OLD_2 not found")
    sys.exit(1)
text = text.replace(OLD_1, NEW_1).replace(OLD_2, NEW_2)
PATH.write_text(text, encoding="utf-8")
print("OK: fixed 2 dynamic-key handlers")
