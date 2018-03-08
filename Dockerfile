# eaas/emscripten-wasm

ARG INSTALL_PREFIX=/emsdk_portable/llvm/clang

FROM trzeci/emscripten

RUN apt-get update && apt-get install -y \
  clang \
  cmake \
  git

ARG ROOT=/root/llvm

WORKDIR $ROOT
RUN git clone --depth 1 https://git.llvm.org/git/llvm

WORKDIR $ROOT/llvm/tools
RUN git clone --depth 1 http://llvm.org/git/clang
RUN git clone --depth 1 http://llvm.org/git/lld

ARG INSTALL_PREFIX
WORKDIR $ROOT/build
RUN cmake -G "Unix Makefiles" \
  -DCMAKE_BUILD_TYPE=MinSizeRel \
  -DCMAKE_INSTALL_PREFIX="$INSTALL_PREFIX" \
  -DLLVM_TARGETS_TO_BUILD=X86 \
  -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly \
  ../llvm
RUN make -j "$(nproc)"

RUN make install

RUN emsdk update && emsdk install latest

FROM trzeci/emscripten
ARG INSTALL_PREFIX
COPY --from=0 "$INSTALL_PREFIX" "$INSTALL_PREFIX"
COPY --from=0 /emsdk_portable/emscripten/ /emsdk_portable/emscripten/
RUN cp -RT /emsdk_portable/emscripten/*/system/ /emsdk_portable/sdk/system/
RUN rm /emsdk_portable/data/.config_sanity
RUN rm -rf /emsdk_portable/data/.cache/

WORKDIR /src
RUN mkdir tmp && cd tmp && touch a.c && emcc a.c && cd .. && rm -rf tmp
RUN apt-get update && apt-get install -y \
  python-pyelftools
