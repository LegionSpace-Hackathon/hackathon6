package com.payegis.cloud.vigil.utils;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class SortUtil {

    public static void compareVersion(List<String> sourceList) {
        Collections.sort(sourceList, new Comparator<String>() {
            @Override
            public int compare(String o1, String o2) {
                return checkVersion(o1,o2);
            }
        });
    }

    public static int checkVersion(String v1, String v2) {
        String[] verArr1 = v1.split("\\.");
        String[] verArr2 = v2.split("\\.");
        int idx = 0;
        int minLength = Math.min(verArr1.length, verArr2.length);
        int diff = 0;
        while (idx < minLength
                && (diff = verArr1[idx].length() - verArr2[idx].length()) == 0
                && (diff = verArr1[idx].compareTo(verArr2[idx])) == 0) {
            ++idx;
        }
        diff = (diff != 0) ? diff : verArr1.length - verArr2.length;
        return diff;
    }
}
